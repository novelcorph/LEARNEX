# ফোন থেকে সবচেয়ে সহজে Deploy

এই project-এ API key browser-এর code-এর মধ্যে রাখা নেই।

## Render দিয়ে

1. ZIP খুলে project-টি GitHub-এ upload করতে হবে।
2. Render-এ গিয়ে GitHub repository দিয়ে **New Web Service** তৈরি করো।
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment Variables-এ:
   - `GEMINI_API_KEY` = তোমার নিজের Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
6. Deploy চাপো।

**API key আমাকে বা GitHub code-এ দেবে না।**
