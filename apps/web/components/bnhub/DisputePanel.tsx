"use client";

import { useCallback, useEffect, useState } from "react";

type Message = { id: string; body: string; senderId: string; createdAt: string; isInternal?: boolean };

export function DisputePanel({ disputeId, senderId }: { disputeId: string; senderId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bnhub/disputes/${encodeURIComponent(disputeId)}/messages`, { credentials: "include" });
    const data = (await res.json()) as Message[] | { error?: string };
    if (Array.isArray(data)) setMessages(data);
    setLoading(false);
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const t = body.trim();
    if (!t) return;
    setSending(true);
    try {
      await fetch(`/api/bnhub/disputes/${encodeURIComponent(disputeId)}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId, body: t }),
      });
      setBody("");
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading dispute thread…</p>;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Dispute messages</h3>
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
        {messages.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-slate-300">
            <span className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add an update for the other party / support…"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => void send()}
          className="shrink-0 self-end rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
