# LEARNEX AI — Direct GitHub + Render Package

This package is intentionally **flat**: every required file is in the repository root. No inner folder is required.

## Files

- `index.html` — UI
- `styles.css` — neon Learnex UI
- `app.js` — chat UI, history, voice input, rendering
- `server.js` — Express server + OpenAI Responses API
- `package.json` — Render/npm configuration
- `learnex-logo.png` — Learnex branding
- `learnex-icon.png` — Learnex app icon
- `learnex-loading.png` — loading/splash screen
- `.env.example` — environment variable template
- `render.yaml` — optional Render Blueprint
- `README.md` — setup guide

## OpenAI configuration

Use these Render Environment Variables:

`OPENAI_API_KEY` = your OpenAI API key

`OPENAI_MODEL` = `gpt-5.6-luna`

`OPENAI_REASONING_EFFORT` = `low`

Do NOT put the API key in `app.js`, `index.html`, GitHub source, or the ZIP.

## Render

Build Command:
`npm install && npm run build`

Start Command:
`npm start`

Environment:
- `OPENAI_API_KEY` = your secret API key
- `OPENAI_MODEL` = `gpt-5.6-luna`
- `OPENAI_REASONING_EFFORT` = `low`

The server uses the `PORT` supplied by Render.

## Important

The frontend never calls OpenAI directly. The browser calls `/api/chat`, and `server.js` calls OpenAI. This keeps the API key on the server.

Math responses are requested in renderable LaTeX and displayed through MathJax, so raw `$$`, `\frac`, `###`, etc. should not appear as broken text.

The app intentionally does not display a "Thinking..." text label. While a response is being generated it shows only animated dots.

## Model choice

`gpt-5.6-luna` is used by default because OpenAI documents it as the GPT-5.6 model optimized for cost-sensitive, high-volume workloads. You can change `OPENAI_MODEL` in Render later without changing the code.
