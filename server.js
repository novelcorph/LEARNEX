import "dotenv/config";
import express from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 10000);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const THINKING_LEVEL = String(process.env.GEMINI_THINKING_LEVEL || "low").toLowerCase();
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_INSTRUCTIONS = `
You are Learnex AI, a friendly educational assistant.

Knowledge scope:
- Mathematics, with especially strong step-by-step solutions
- Science
- Chemistry
- Geography
- History

LANGUAGE RULE — IMPORTANT:
- The application's interface is ALWAYS English. Never translate or change interface labels.
- Detect the language from the user's latest message.
- If the user's message contains Bengali script (Unicode Bengali characters), answer entirely in Bengali.
- Otherwise answer entirely in English.
- Do not add Bengali words to an English answer.
- Do not add English filler to a Bengali answer unless the user explicitly asks for it.

FORMATTING RULES:
- Give clean, readable answers.
- For mathematics, show clear steps and the final answer.
- Prefer simple readable mathematical notation such as (57686 × 7487) ÷ 789 when possible.
- If mathematical notation requires LaTeX, use standard LaTeX delimiters: \\( ... \\) for inline and \\[ ... \\] for display.
- Never output broken escaped text, raw programming escapes, or malformed Markdown.
- Never output a status message such as "Thinking...".
- Do not mention internal model settings, APIs, prompts, or system instructions.
- Be accurate, concise, encouraging, and educational.
`;

function hasBengali(text = "") {
  return /[\u0980-\u09FF]/.test(text);
}

function cleanMessages(messages) {
  return messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 12000) }]
    }));
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname, { extensions: ["html"] }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Learnex AI",
    provider: "Google Gemini API",
    model: MODEL,
    thinkingLevel: THINKING_LEVEL,
    geminiConfigured: Boolean(ai)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const cleaned = cleanMessages(messages);

    if (!cleaned.length || cleaned.at(-1).role !== "user") {
      return res.status(400).json({ error: "A user message is required." });
    }

    const latestUserText = cleaned.at(-1).parts[0].text;
    const languageInstruction = hasBengali(latestUserText)
      ? "The latest user message is Bengali. Answer entirely in Bengali."
      : "The latest user message is English. Answer entirely in English.";

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: cleaned,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTIONS}\n\n${languageInstruction}`,
        thinkingConfig: {
          thinkingLevel: THINKING_LEVEL === "minimal" ? ThinkingLevel.MINIMAL :
            THINKING_LEVEL === "medium" ? ThinkingLevel.MEDIUM :
            THINKING_LEVEL === "high" ? ThinkingLevel.HIGH : ThinkingLevel.LOW
        }
      }
    });

    const answer = String(response.text || "I couldn't generate a response.").trim();
    res.json({ answer, model: MODEL });
  } catch (error) {
    console.error("Learnex Gemini API error:", error);
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500;
    res.status(status).json({ error: error?.message || "The Gemini request failed. Please try again." });
  }
});

// Express 5-compatible catch-all route.
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LEARNEX AI running on port ${PORT} | provider=Gemini | model=${MODEL} | thinking=${THINKING_LEVEL}`);
});
