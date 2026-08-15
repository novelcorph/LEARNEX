# Learnex AI — secure Gemini version

This version keeps the Google Gemini API key on the server instead of exposing it in the browser.

## Run

1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Put your Gemini API key in `.env`:
   GEMINI_API_KEY=your_key_here
6. Start:
   npm run dev
7. Open the Vite address shown in the terminal (normally http://localhost:5173).

## Important

Do NOT paste your API key into `learnex-ai.jsx`, `main.jsx`, or any frontend file.
Do NOT commit `.env` to GitHub.
The frontend sends messages to `/api/chat`; the Node/Express server calls Gemini.
