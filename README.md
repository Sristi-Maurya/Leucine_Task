# Todo Summary Assistant

## Setup Instructions

1. **Clone this repository**
    git clone https://github.com/Sristi-Maurya/Leucine_Task.git

2. **Install Backend Dependencies**
    cd backend
    npm install

3. **Install Frontend Dependencies**
    cd ../frontend
    npm install

4. **Set Up Environment Variables**

- Copy `.env.example` to `.env` in the `backend` folder.
- Fill in your own API keys and URLs (see below).

5. **Run the Backend**
    cd ../backend
    node index.js


6. **Run the Frontend**
    cd../frontend
    npm run dev


7. **Open the App**

- Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## Slack and LLM (OpenAI) Setup Guidance

### Slack Webhook Setup

- Go to [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks).
- Create a new webhook for your workspace and select the channel you want to post summaries to.
- Copy the webhook URL and paste it in your `.env` file as `SLACK_WEBHOOK_URL`.

### OpenAI API Key Setup

- Go to [OpenAI API Keys](https://platform.openai.com/api-keys).
- Create a new API key (you may need to add a payment method if you hit free tier limits).
- Copy the API key and paste it in your `.env` file as `OPENAI_API_KEY`.

### Supabase/PostgreSQL Database Setup

- Go to [Supabase](https://supabase.com) and create a free project.
- In your project, go to **Settings → Database** and copy the connection string.
- Paste this in your `.env` file as `DATABASE_URL`.
- Make sure your `todos` table exists. You can create it with:

    CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    ompleted BOOLEAN DEFAULT FALSE
    );


---

## Design / Architecture Decisions

- **Frontend:**  
- Built with React (Vite).
- Handles user input, displays todos, and interacts with the backend via REST API.

- **Backend:**  
- Node.js with Express for API endpoints.
- Connects to a Supabase/PostgreSQL database to store todos.
- Integrates with the OpenAI API to summarize todos.
- Sends summaries to Slack using Incoming Webhooks.

- **Environment Variables:**  
- All sensitive keys (OpenAI, Slack, database) are stored in `.env` (not committed to GitHub).
- `.env.example` is provided for reference.

- **Security:**  
- Never commit your real `.env` file or secrets to GitHub.
- Always use `.env.example` for sharing variable names only.

---

## Example `.env.example`
    OPENAI_API_KEY=
    SLACK_WEBHOOK_URL=
    DATABASE_URL=
