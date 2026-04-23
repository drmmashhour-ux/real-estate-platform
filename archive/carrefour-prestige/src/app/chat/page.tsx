"use client";

import { useState } from "react";

export default function ChatPage() {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setReply(data.reply ?? data.error ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-light text-white">AI assistant</h1>
      <p className="mt-2 text-xs text-emerald-200/50">
        General guidance only — not legal or financial advice.
      </p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        className="mt-6 w-full rounded-lg border border-emerald-900/60 bg-[#0c1a14] p-3 text-white"
        rows={4}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => void send()}
        className="mt-3 rounded-full bg-[#d4af37] px-6 py-2 text-sm font-semibold text-[#030712] disabled:opacity-50"
      >
        {loading ? "…" : "Send"}
      </button>
      {reply && <p className="mt-6 whitespace-pre-wrap text-sm text-emerald-100/90">{reply}</p>}
    </div>
  );
}
