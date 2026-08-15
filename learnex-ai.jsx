import React, { useState, useRef, useEffect } from "react";
import { Send, Plus, Menu, X, Trash2, Compass } from "lucide-react";

const SUGGESTIONS = [
  "Explain photosynthesis like I'm 12",
  "Quiz me on the French Revolution",
  "Help me outline an essay on climate change",
  "Break down how neural networks learn",
];

const HELLO_MESSAGE = {
  id: "hello-msg",
  role: "assistant",
  content:
    "Hello! I'm Learnex AI. Ask me anything you're studying, paste in something confusing, or pick a starting point below to begin.",
};

function makeChat(title, withHello) {
  return {
    id: crypto.randomUUID(),
    title,
    messages: withHello ? [HELLO_MESSAGE] : [],
  };
}

const SYSTEM_PROMPT =
  "You are Learnex AI, a friendly, encouraging learning assistant. Explain concepts clearly, break things into steps, and check understanding. Keep answers focused and not overly long.";

async function getLiveReply(history) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "AI request failed");
  }

  return data.reply || "Sorry, I couldn't generate a response just now — try again.";
}

// Logomark: three interlocking rings, built from the hand-drawn reference —
// teal, indigo and charcoal woven in a loose triquetra arrangement.
function LearnexMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="38" cy="60" r="24" stroke="#232A2E" strokeWidth="11" />
      <circle cx="50" cy="37" r="24" stroke="#2FA79E" strokeWidth="11" />
      <circle cx="62" cy="60" r="24" stroke="#31388F" strokeWidth="11" />
    </svg>
  );
}

export default function LearnexAI() {
  const [chats, setChats] = useState(() => [makeChat("New session", true)]);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeId) || chats[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isTyping]);

  function updateChat(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  async function sendMessage(text) {
    const content = text ?? input;
    if (!content.trim() || isTyping) return;

    const chatId = activeChat.id;
    const userMsg = { id: crypto.randomUUID(), role: "user", content };
    const priorMessages = activeChat.messages.filter((m) => m.id !== "hello-msg");

    updateChat(chatId, (c) => ({
      ...c,
      title:
        c.messages.filter((m) => m.role === "user").length === 0
          ? content.slice(0, 40)
          : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput("");
    setIsTyping(true);

    try {
      const replyText = await getLiveReply([...priorMessages, userMsg]);
      const reply = { id: crypto.randomUUID(), role: "assistant", content: replyText };
      updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, reply] }));
    } catch (err) {
      const reply = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Something went wrong reaching Learnex AI. Please try again.",
      };
      updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, reply] }));
    } finally {
      setIsTyping(false);
    }
  }

  function newChat() {
    const c = makeChat("New session", false);
    setChats((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function deleteChat(id, e) {
    e.stopPropagation();
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = makeChat("New session", true);
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  // Palette (light mode)
  const C = {
    bg: "#F6F7F5",
    sidebarBg: "#EEF1EF",
    border: "#DEE3E0",
    text: "#1C2422",
    textMuted: "#6B7A77",
    textFaint: "#8FA09C",
    hoverBg: "#E4E9E6",
    activeBg: "#DCEAE7",
    bubbleUser: "#DCEAE7",
    bubbleAssistant: "#FFFFFF",
    teal: "#2FA79E",
    indigo: "#31388F",
    charcoal: "#232A2E",
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: C.bg,
        color: C.text,
        height: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #C9D2CE; border-radius: 8px; }
        .lx-fade-in { animation: lxFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes lxFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .lx-dot { animation: lxBounce 1.2s infinite ease-in-out; }
        @keyframes lxBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        textarea:focus, input:focus { outline: none; }
        .lx-btn, .lx-item, .lx-suggest { transition: background 0.18s ease, border-color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease; }
        .lx-suggest:hover { transform: translateY(-1px); }
        .lx-send:active { transform: scale(0.94); }
        .lx-textarea { transition: box-shadow 0.18s ease; }
        @media (prefers-reduced-motion: reduce) {
          .lx-fade-in, .lx-dot, .lx-btn, .lx-item, .lx-suggest { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 264 : 0,
          minWidth: sidebarOpen ? 264 : 0,
          background: C.sidebarBg,
          borderRight: `1px solid ${C.border}`,
          transition: "width 0.22s cubic-bezier(0.22, 1, 0.36, 1), min-width 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "18px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
            <LearnexMark size={28} />
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: C.text,
              }}
            >
              Learnex AI
            </span>
          </div>

          <button
            className="lx-btn"
            onClick={newChat}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "#FFFFFF",
              color: C.text,
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <Plus size={16} /> New session
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
          <div
            style={{
              fontSize: 11,
              color: C.textFaint,
              padding: "8px 8px 6px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Recent
          </div>
          {chats.map((c) => (
            <div
              key={c.id}
              className="lx-item"
              onClick={() => setActiveId(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 10px",
                borderRadius: 8,
                marginBottom: 2,
                cursor: "pointer",
                background: c.id === activeId ? C.activeBg : "transparent",
                color: c.id === activeId ? C.text : C.textMuted,
                fontSize: 13.5,
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (c.id !== activeId) e.currentTarget.style.background = C.hoverBg;
              }}
              onMouseLeave={(e) => {
                if (c.id !== activeId) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </span>
              <Trash2
                size={13}
                style={{ flexShrink: 0, opacity: 0.55 }}
                onClick={(e) => deleteChat(c.id, e)}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            padding: 14,
            borderTop: `1px solid ${C.border}`,
            fontSize: 12,
            color: C.textFaint,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Compass size={14} />
          <span>Live — powered by Claude</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4 }}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span style={{ fontSize: 13.5, color: C.textMuted, fontWeight: 500 }}>
            {activeChat.title}
          </span>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
            {activeChat.messages.map((m) => (
              <div
                key={m.id}
                className="lx-fade-in"
                style={{
                  display: "flex",
                  marginBottom: 22,
                  gap: 12,
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: m.role === "user" ? "#D5DDDA" : "#FFFFFF",
                    border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {m.role === "user" ? "Y" : <LearnexMark size={16} />}
                </div>
                <div
                  style={{
                    background: m.role === "user" ? C.bubbleUser : C.bubbleAssistant,
                    border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: "11px 15px",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    maxWidth: "80%",
                    boxShadow: m.role === "user" ? "none" : "0 1px 2px rgba(28,36,34,0.04)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="lx-fade-in" style={{ display: "flex", gap: 12, marginBottom: 22 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#FFFFFF",
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LearnexMark size={16} />
                </div>
                <div
                  style={{
                    background: C.bubbleAssistant,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: "13px 16px",
                    display: "flex",
                    gap: 5,
                    boxShadow: "0 1px 2px rgba(28,36,34,0.04)",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="lx-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: C.teal,
                        animationDelay: `${i * 0.15}s`,
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeChat.messages.filter((m) => m.role === "user").length === 0 && (
              <div className="lx-fade-in" style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    maxWidth: 560,
                    marginLeft: 40,
                  }}
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="lx-suggest"
                      onClick={() => sendMessage(s)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: "#FFFFFF",
                        color: C.text,
                        fontSize: 13.5,
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(28,36,34,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.teal;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 20px 20px" }}>
          <div
            className="lx-textarea"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              background: "#FFFFFF",
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "8px 8px 8px 16px",
              boxShadow: "0 1px 3px rgba(28,36,34,0.05)",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message Learnex AI…"
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: C.text,
                fontSize: 14.5,
                fontFamily: "inherit",
                resize: "none",
                maxHeight: 140,
                padding: "8px 0",
              }}
            />
            <button
              className="lx-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: "none",
                flexShrink: 0,
                background: input.trim() && !isTyping ? C.teal : "#E4E9E6",
                color: input.trim() && !isTyping ? "#FFFFFF" : C.textFaint,
                cursor: input.trim() && !isTyping ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.18s ease, transform 0.15s ease",
              }}
            >
              <Send size={15} />
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: C.textFaint, marginTop: 10 }}>
            Learnex AI can make mistakes. Check important information.
          </div>
        </div>
      </div>
    </div>
  );
}
