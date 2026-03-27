"use client";

import { useState } from "react";

export function ClientAIChat({ documentId }: { documentId: string }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setText("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const res = await fetch(`/api/client-trust/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "Something went wrong.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Could not reach the server. Try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Questions</p>
      <p className="mt-1 text-xs text-slate-400">
        Ask what something means, how the process works, or what to do next. This assistant does not give legal advice or guess outcomes.
      </p>
      <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-white/5 bg-black/30 p-2 text-xs">
        {messages.length === 0 ? <p className="text-slate-500">No messages yet.</p> : null}
        {messages.map((m, i) => (
          <div key={`${i}-${m.role}`} className={m.role === "user" ? "text-slate-200" : "text-slate-400"}>
            <span className="font-medium text-slate-500">{m.role === "user" ? "You" : "Assistant"}: </span>
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
          placeholder="Type a question…"
        />
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() => void send()}
          className="rounded-md bg-white/10 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
