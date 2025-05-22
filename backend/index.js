require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Log the database URL
const dbUrl = process.env.DATABASE_URL || 'Not set';
console.log('Database URL pattern:', dbUrl.replace(/(:.*@)/g, ':***@'));

// Connect to Supabase/PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
});

// Adding a test endpoint to verify the server is running
app.get('/', (req, res) => {
  res.send('Todo Summary API is running!');
});

// GET /todos - Fetching all todos
app.get('/todos', async (req, res) => {
  try {
    console.log('Attempting to fetch todos from database...');
    const result = await pool.query('SELECT * FROM todos ORDER BY id');
    console.log(`Successfully fetched ${result.rows.length} todos`);
    res.json(result.rows);
  } catch (err) {
    console.error('ERROR fetching todos:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// POST /todos - Adding a new todo
app.post('/todos', async (req, res) => {
  const { text } = req.body;
  try {
    console.log('Attempting to add new todo:', text);
    const result = await pool.query(
      'INSERT INTO todos (text, completed) VALUES ($1, $2) RETURNING *',
      [text, false]
    );
    console.log('Todo added successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('ERROR adding todo:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// DELETE /todos/:id - Deleting a todo
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Attempting to delete todo with ID:', id);
    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    console.log('Todo deleted successfully');
    res.sendStatus(204);
  } catch (err) {
    console.error('ERROR deleting todo:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// PUT /todos/:id - Editing a todo
app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    console.log('Attempting to update todo with ID:', id);
    const result = await pool.query(
      'UPDATE todos SET text = $1 WHERE id = $2 RETURNING *',
      [text, id]
    );
    console.log('Todo updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('ERROR updating todo:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// POST /summarize - Summarize todos and send to Slack
app.post('/summarize', async (req, res) => {
  try {
    console.log('Attempting to summarize todos...');
    const todosRes = await pool.query('SELECT * FROM todos WHERE completed = false');
    const todos = todosRes.rows.map(t => t.text).join('\n');
    
    console.log('Calling OpenAI API for summary...');
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Summarize these todos:\n${todos}` }]
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    const summary = openaiRes.data.choices[0].message.content;
    
    console.log('Sending summary to Slack...');
    await axios.post(process.env.SLACK_WEBHOOK_URL, { text: summary });
    console.log('Summary sent to Slack successfully');
    res.json({ success: true, summary });
  } catch (err) {
    console.error('ERROR in summarize endpoint:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('⚠️ Database connection error:', err.message);
    console.error('Please check your DATABASE_URL in .env file');
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
    
    // Check if todos table exists
    pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'todos'
      )
    `, (err, res) => {
      if (err) {
        console.error('Error checking if todos table exists:', err.message);
      } else if (!res.rows[0].exists) {
        console.warn('⚠️ "todos" table does not exist! Creating table...');
        pool.query(`
          CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            text TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE
          )
        `, (err) => {
          if (err) {
            console.error('Failed to create todos table:', err.message);
          } else {
            console.log('✅ "todos" table created successfully!');
          }
        });
      } else {
        console.log('✅ "todos" table exists');
      }
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
