"use client";

import { useCallback, useEffect, useState } from "react";

type Msg = {
  id: string;
  dealId: string | null;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null };
};

type Share = {
  id: string;
  dealId: string;
  note: string | null;
  createdAt: string;
  deal: { id: string; dealCode: string | null; status: string } | null;
  targetUser: { id: string; name: string | null; email: string | null };
  createdBy: { id: string; name: string | null; email: string | null };
};

export function CollaborationPanel({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [text, setText] = useState("");
  const [dealId, setDealId] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [mRes, sRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/monopoly/collaboration/messages`, { credentials: "include" }),
      fetch(`/api/workspaces/${workspaceId}/monopoly/collaboration/shares`, { credentials: "include" }),
    ]);
    const mJson = (await mRes.json()) as { messages?: Msg[] };
    const sJson = (await sRes.json()) as { shares?: Share[] };
    if (mRes.ok && mJson.messages) setMessages(mJson.messages);
    if (sRes.ok && sJson.shares) setShares(sJson.shares);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/monopoly/collaboration/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          dealId: dealId.trim() || null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNote(j.error ?? "Send failed");
        return;
      }
      setText("");
      void load();
    } catch {
      setNote("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Internal messages</h2>
        <p className="text-xs text-slate-500">Visible to members of this workspace only.</p>
        <form onSubmit={sendMessage} className="space-y-2 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
          <input
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="Optional deal ID"
            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your team…"
            rows={3}
            className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200"
          />
          {note ? <p className="text-xs text-amber-200">{note}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Post"}
          </button>
        </form>
        <ul className="max-h-80 space-y-2 overflow-y-auto text-sm text-slate-300">
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="text-xs text-slate-500">
                {m.author.name || m.author.email} · {new Date(m.createdAt).toLocaleString()}
                {m.dealId ? <span className="ml-2 font-mono text-slate-600">{m.dealId.slice(0, 8)}…</span> : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-slate-200">{m.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Shared deals</h2>
        <p className="text-xs text-slate-500">Deal pointers shared with you or by you (workspace only).</p>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {shares.length === 0 ? <li className="text-slate-500">No shares yet.</li> : null}
          {shares.map((s) => (
            <li key={s.id} className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-slate-300">
              <div className="font-medium text-slate-100">{s.deal?.dealCode || s.dealId.slice(0, 8)}</div>
              <div className="text-xs text-slate-500">{s.deal?.status}</div>
              <div className="mt-1 text-xs text-slate-500">
                To {s.targetUser.name || s.targetUser.email} · from {s.createdBy.name || s.createdBy.email}
              </div>
              {s.note ? <p className="mt-1 text-slate-400">{s.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
