"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  leadId: string | null;
  updatedAt: string;
  lead: { id: string; name: string; email: string; phone: string } | null;
  clientUser: { id: string; name: string | null; email: string } | null;
  lastMessage: { content: string; sender: string; createdAt: string } | null;
};

type Msg = { id: string; sender: string; content: string; createdAt: string };

export function ExpertInboxClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/immo/conversations");
    if (!res.ok) return;
    const data = (await res.json()) as { conversations: Row[] };
    setRows(data.conversations ?? []);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/immo/conversations/${id}?markRead=1`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    void refreshList();
    const t = setInterval(() => void refreshList(), 8000);
    return () => clearInterval(t);
  }, [refreshList]);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId);
    const t = setInterval(() => void loadThread(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  async function sendReply() {
    if (!activeId || !reply.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/immo/conversations/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      if (!res.ok) throw new Error("send failed");
      setReply("");
      await loadThread(activeId);
      await refreshList();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Immo inbox</h1>
        <p className="mt-1 text-sm text-[#B3B3B3]">
          Chats from the AI widget and leads assigned to you. Messages refresh automatically.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-2 rounded-2xl border border-white/10 bg-[#121212] p-2">
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-[#B3B3B3]">No conversations yet.</p>
          ) : null}
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`w-full rounded-xl p-3 text-left transition hover:bg-white/5 ${
                activeId === r.id ? "bg-premium-gold/15 ring-1 ring-premium-gold/40" : ""
              }`}
            >
              <p className="text-sm font-medium text-white">
                {r.lead?.name ?? r.clientUser?.name ?? r.clientUser?.email ?? "Guest"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[#B3B3B3]">
                {r.lastMessage?.content ?? "—"}
              </p>
              {r.leadId ? (
                <Link
                  href="/dashboard/expert/leads"
                  className="mt-2 inline-block text-[10px] font-semibold text-premium-gold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View lead →
                </Link>
              ) : null}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 flex min-h-[420px] flex-col rounded-2xl border border-white/10 bg-[#121212]">
          {!activeId ? (
            <p className="m-auto text-sm text-[#B3B3B3]">Select a conversation.</p>
          ) : (
            <>
              <div className="max-h-[340px] flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "expert" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "user"
                          ? "bg-white/10 text-white"
                          : m.sender === "expert"
                            ? "bg-premium-gold text-black"
                            : "border border-premium-gold/30 bg-black/40 text-[#E5E5E5]"
                      }`}
                    >
                      <span className="mb-1 block text-[10px] uppercase text-[#B3B3B3]">
                        {m.sender}
                      </span>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply as expert…"
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendReply())}
                  />
                  <button
                    type="button"
                    disabled={loading || !reply.trim()}
                    onClick={() => void sendReply()}
                    className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
