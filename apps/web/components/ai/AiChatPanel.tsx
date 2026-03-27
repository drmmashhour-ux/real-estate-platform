"use client";

import { useState, useRef, useEffect } from "react";

const GOLD = "#C9A96E";
const DARK = "#0f0f0f";

type Message = { role: "user" | "assistant"; text: string };

export function AiChatPanel({
  listingId,
  onSend,
}: {
  listingId: string;
  onSend?: (message: string) => Promise<string>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const reply = onSend
        ? await onSend(text)
        : await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId, message: text }),
            credentials: "same-origin",
          })
            .then((r) => r.json())
            .then((d) => d.reply ?? "No response.");
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "AI assistant is temporarily unavailable." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        border: `1px solid ${GOLD}40`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: 360,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${GOLD}30`,
          color: GOLD,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Ask AI about this listing
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          minHeight: 180,
          maxHeight: 220,
        }}
      >
        {messages.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            e.g. &quot;improve this listing&quot;, &quot;what price should I set?&quot;, &quot;best template?&quot;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              padding: 8,
              borderRadius: 8,
              background: msg.role === "user" ? "rgba(201,169,110,0.15)" : "rgba(0,0,0,0.2)",
              fontSize: 13,
              color: "#e5e5e5",
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Thinking…</p>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${GOLD}20` }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${GOLD}40`,
              background: DARK,
              color: "#fff",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: GOLD,
              color: DARK,
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
