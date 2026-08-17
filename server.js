import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 10000);
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_INSTRUCTIONS = `
You are Learnex AI, a friendly educational assistant for Bengali and English learners.

Core subjects:
- Mathematics (give especially strong, step-by-step explanations)
- Science
- Chemistry
- Geography
- History

Language:
- Reply in the same language the user uses. If the user writes Bengali, answer in Bengali.
- If the user writes English, answer in English.
- If the user mixes Bengali and English, use a natural mix that remains easy to understand.

Answer style:
- Be accurate, clear, encouraging, and focused.
- For mathematics, show clean steps and the final answer.
- Use Markdown when useful.
- For mathematical notation, use standard LaTeX delimiters such as \\(...\\) for inline math and \\[...\\] for display math.
- NEVER output raw LaTeX delimiters such as $$, raw sequences like \\\\frac, or Markdown markers that would look broken if rendered.
- Do not say "Thinking..." or add a fake waiting message.
- Do not claim to have performed an action you did not perform.
- If a question is ambiguous, ask one concise clarification.
- You are primarily an educational assistant; do not unnecessarily discuss programming/coding unless the user asks.
`;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname, { extensions: ["html"] }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Learnex AI",
    model: MODEL,
    openaiConfigured: Boolean(client)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "OPENAI_API_KEY is not configured on the server."
      });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const cleaned = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

    if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
      return res.status(400).json({ error: "A user message is required." });
    }

    const response = await client.responses.create({
      model: MODEL,
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "low" },
      instructions: SYSTEM_INSTRUCTIONS,
      input: cleaned,
      max_output_tokens: 5000
    });

    res.json({
      answer: response.output_text || "I couldn't generate a response.",
      model: MODEL
    });
  } catch (error) {
    console.error("Learnex API error:", error);
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500;
    res.status(status).json({
      error: error?.message || "The AI request failed. Please try again."
    });
  }
});

app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LEARNEX AI running on port ${PORT}`);
  console.log(`Model: ${MODEL}`);
});
