import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT =
  "You are Learnex AI, a friendly, encouraging learning assistant. " +
  "Explain concepts clearly, break things into steps, and check understanding. " +
  "Keep answers focused and not overly long.";

app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

app.post("/api/chat", async (req, res) => {
  try {
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Add it to your .env file.",
      });
    }

    const contents = history
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    if (!contents.length) {
      return res.status(400).json({ error: "No message was provided." });
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent` +
      `?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      const message =
        data?.error?.message || `Google API error (${googleResponse.status})`;
      return res.status(googleResponse.status).json({ error: message });
    }

    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({ error: "Gemini returned an empty response." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Learnex AI server error:", error);
    res.status(500).json({
      error: "The server could not reach the AI service.",
    });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Learnex AI server running at http://localhost:${PORT}`);
});
