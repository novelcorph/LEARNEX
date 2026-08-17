const $ = (s) => document.querySelector(s);

const splash = $("#splash");
const app = $("#app");
const chat = $("#chat");
const welcome = $("#welcome");
const promptBox = $("#prompt");
const sendBtn = $("#sendBtn");
const micBtn = $("#micBtn");
const dotsLoader = $("#dotsLoader");
const sidebar = $("#sidebar");
const historyBox = $("#history");

const STORAGE_KEY = "learnex_ai_history_v3";
let messages = [];
let chatTitle = "New Learnex chat";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

function protectMath(text) {
  const blocks = [];
  const patterns = [
    /\$\$[\s\S]*?\$\$/g,
    /\\\[[\s\S]*?\\\]/g,
    /\\\([\s\S]*?\\\)/g,
    /\$[^$\n]+\$/g
  ];
  for (const re of patterns) {
    text = text.replace(re, match => {
      const id = `@@MATH${blocks.length}@@`;
      blocks.push(match);
      return id;
    });
  }
  return { text, blocks };
}

function restoreMath(text, blocks) {
  return text.replace(/@@MATH(\d+)@@/g, (_, i) => blocks[Number(i)] || "");
}

function markdownToHtml(raw) {
  let { text, blocks } = protectMath(raw);
  text = escapeHtml(text);

  text = text.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );
  text = text.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  text = text.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  const lines = text.split(/\n{2,}/).map(part => {
    if (/^<(h2|h3|ul|pre)/.test(part.trim())) return part;
    return `<p>${part.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  return restoreMath(lines, blocks);
}

function addMessage(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  if (role === "assistant") {
    wrap.innerHTML = `
      <img class="avatar" src="/learnex-icon.png" alt="Learnex AI">
      <div class="bubble"><div class="msg-label">LEARNEX AI ✦</div>${markdownToHtml(content)}</div>
    `;
  } else {
    wrap.innerHTML = `<div class="bubble">${markdownToHtml(content)}</div>`;
  }
  chat.appendChild(wrap);

  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([wrap]).catch(() => {});
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function renderAll() {
  chat.innerHTML = "";
  messages.forEach(m => addMessage(m.role, m.content));
  welcome.classList.toggle("is-hidden", messages.length > 0);
}

function saveHistory() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const item = {
    id: uid(),
    title: chatTitle.slice(0, 80),
    messages,
    updated: Date.now()
  };
  list.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  renderHistory();
}

function renderHistory() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  historyBox.innerHTML = list.map(item =>
    `<button data-id="${item.id}">${escapeHtml(item.title || "Learnex chat")}</button>`
  ).join("");
  historyBox.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = list.find(x => x.id === btn.dataset.id);
      if (!item) return;
      messages = Array.isArray(item.messages) ? item.messages : [];
      chatTitle = item.title || "Learnex chat";
      renderAll();
      sidebar.classList.remove("open");
    });
  });
}

function newChat() {
  messages = [];
  chatTitle = "New Learnex chat";
  chat.innerHTML = "";
  welcome.classList.remove("is-hidden");
  promptBox.value = "";
  promptBox.focus();
  sidebar.classList.remove("open");
}

async function sendMessage(text = promptBox.value.trim()) {
  if (!text || dotsLoader.classList.contains("is-loading")) return;

  if (messages.length === 0) {
    chatTitle = text.replace(/\s+/g, " ").slice(0, 70);
  }

  messages.push({ role: "user", content: text });
  addMessage("user", text);
  welcome.classList.add("is-hidden");
  promptBox.value = "";
  promptBox.style.height = "auto";

  dotsLoader.classList.remove("is-hidden");
  dotsLoader.classList.add("is-loading");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");

    const answer = data.answer || "I couldn't generate a response.";
    messages.push({ role: "assistant", content: answer });
    addMessage("assistant", answer);
    saveHistory();
  } catch (error) {
    const msg = `Sorry — ${error.message}`;
    messages.push({ role: "assistant", content: msg });
    addMessage("assistant", msg);
  } finally {
    dotsLoader.classList.add("is-hidden");
    dotsLoader.classList.remove("is-loading");
    promptBox.focus();
  }
}

$("#menuBtn").addEventListener("click", () => sidebar.classList.add("open"));
$("#closeMenu").addEventListener("click", () => sidebar.classList.remove("open"));
$("#newChatBtn").addEventListener("click", newChat);
$("#attachBtn").addEventListener("click", newChat);
$("#clearBtn").addEventListener("click", newChat);
sendBtn.addEventListener("click", () => sendMessage());

promptBox.addEventListener("input", () => {
  promptBox.style.height = "auto";
  promptBox.style.height = Math.min(promptBox.scrollHeight, 130) + "px";
});
promptBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
});

// Browser voice input when supported.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN";
  recognition.onstart = () => micBtn.classList.add("recording");
  recognition.onend = () => micBtn.classList.remove("recording");
  recognition.onresult = (event) => {
    promptBox.value = event.results[0][0].transcript;
    promptBox.dispatchEvent(new Event("input"));
  };
  micBtn.addEventListener("click", () => recognition.start());
} else {
  micBtn.addEventListener("click", () => {
    promptBox.focus();
    alert("Voice input is not supported by this browser.");
  });
}

renderHistory();

setTimeout(() => {
  splash.classList.add("done");
  app.classList.remove("is-hidden");
  setTimeout(() => splash.remove(), 600);
}, 2200);
