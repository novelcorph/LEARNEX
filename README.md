# LEARNEX AI

A mobile-first educational AI web app with a neon LEARNEX identity.

## Included
- No `src` folder. Every application file is at repository root.
- Express server + static frontend; no React/Vite dependency, so the previous `Rollup failed to resolve import "react"` problem is avoided.
- Gemini 3.6 Flash integration through a server-side API route.
- English/Bengali automatic response language behavior.
- Strong educational focus: Mathematics, Science, Chemistry, Geography and History.
- Responsive mobile UI inspired by the supplied LEARNEX neon design.
- LEARNEX logo, splash/loading screen and `BY ARIJIT DAS` credit.
- Hamburger menu with a large side panel.
- Clear chat, new chat, math helper and study helper.
- Voice input when supported by the browser.
- Quick-start learning prompts.
- Conversation history kept in the current browser session.

## Render
Build command:
`npm install && npm run build`

Start command:
`npm start`

Root Directory: leave blank.

Add an Environment Variable:
`GEMINI_API_KEY` = your Google AI Studio API key.

Optional:
`GEMINI_MODEL` = `gemini-3.6-flash`

Do not put the API key inside `app.js`, `index.html`, or any public file.
