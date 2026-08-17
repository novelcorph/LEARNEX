# LEARNEX AI — FINAL ROOT-ONLY BUILD

Every required file is at the repository root. No folders are included.

Features: mobile-first neon UI, supplied LEARNEX logo, supplied loading screen with BY ARIJIT DAS, English-first UI, Bengali replies when the user writes Bengali, Mathematics/Science/Chemistry/Geography/History focus, math-friendly LaTeX rendering, clean Markdown, no fake Thinking message, new chat/clear, local history, suggestions, voice input, Render-ready Express 5 server, Gemini 3.7 Flash primary model with minimal thinking for low latency, and automatic 3.6 Flash fallback.

Render Build Command: `npm install && npm run build`
Render Start Command: `npm start`
Environment variable: `GEMINI_API_KEY`
Optional: `GEMINI_MODEL=gemini-3.7-flash`

Never commit the real API key to GitHub.

The previous Express 5 `app.get("*")` crash is fixed; this version does not use that route.
