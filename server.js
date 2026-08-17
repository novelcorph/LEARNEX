import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

const SYSTEM_PROMPT = `
You are LEARNEX AI, a friendly and highly accurate educational assistant.

MISSION:
- Help students learn clearly and confidently.
- Main subjects: Mathematics, Science, Chemistry, Geography, and History.
- Mathematics is a priority: calculate carefully, show useful steps, and clearly mark the final answer.
- You may explain general educational topics when they help learning.

LANGUAGE:
- Normally use English.
- If the user writes in Bengali, reply in Bengali.
- If the user writes in English, reply in English.
- If the user mixes Bengali and English, naturally use the language mix the user uses.
- Do not put Bengali-language labels or Bengali UI wording into the answer unless the user actually uses Bengali or asks for Bengali.

FORMATTING:
- Return clean Markdown.
- For mathematics, use standard LaTeX such as $a/b$ or $$...$$ only when it genuinely improves clarity.
- Never output escaped/doubly-escaped LaTeX such as \\\\frac or raw JSON.
- Never output HTML tags.
- Never show private chain-of-thought.
- Never write a "Thinking..." section.
- Do not say you are thinking or processing unless there is a real temporary service state.
- Keep answers focused but complete.
`;

function cleanModelText(text) {
  return String(text || "").replace(/```(?:markdown|md)?\\s*/gi, "").replace(/```$/g, "").trim();
}

async function callGemini(model, apiKey, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        thinkingConfig: { thinkingLevel: "minimal" },
        maxOutputTokens: 4096
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error?.message || `Gemini request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  const text = data?.candidates?.[0]?.content?.parts?.filter(p => typeof p.text === "string").map(p => p.text).join("") || "";
  if (!text) throw new Error("Gemini returned an empty answer.");
  return cleanModelText(text);
}

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) return res.status(400).json({ error: "Message is required." });
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Gemini is not connected. Add GEMINI_API_KEY in Render → Environment." });

    const contents = history.slice(-14).map(item => ({
      role: item.role === "model" ? "model" : "user",
      parts: [{ text: String(item.text || "").slice(0, 12000) }]
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const preferred = process.env.GEMINI_MODEL || "gemini-3.7-flash";
    let reply;
    try {
      reply = await callGemini(preferred, apiKey, contents);
    } catch (firstError) {
      if (preferred !== "gemini-3.6-flash" && (firstError.status === 400 || firstError.status === 404)) {
        reply = await callGemini("gemini-3.6-flash", apiKey, contents);
      } else throw firstError;
    }
    res.json({ reply, model: preferred });
  } catch (err) {
    console.error("LEARNEX AI error:", err);
    res.status(500).json({ error: "The AI service failed. Please try again." });
  }
});

// Express 5 compatible fallback. Do NOT use app.get("*").
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => console.log(`LEARNEX AI running on port ${PORT}`));
