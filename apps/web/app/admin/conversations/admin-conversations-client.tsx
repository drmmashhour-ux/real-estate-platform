"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  leadId: string | null;
  expertId: string | null;
  updatedAt: string;
  lead: { id: string; name: string; email: string; status: string } | null;
  clientUser: { id: string; name: string | null; email: string } | null;
  lastMessage: { content: string; sender: string; createdAt: string } | null;
};

type Msg = { id: string; sender: string; content: string; createdAt: string };

export function AdminConversationsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/immo/conversations");
    if (!res.ok) return;
    const data = (await res.json()) as { conversations: Row[] };
    setRows(data.conversations ?? []);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/immo/conversations/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    const t = setInterval(() => void load(), 12000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    if (!activeId) return;
    const kick = window.setTimeout(() => void loadThread(activeId), 0);
    const t = setInterval(() => void loadThread(activeId), 5000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, [activeId, loadThread]);

  return (
    <div className="mt-6 space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">CRM — Immo conversations</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor AI chats and linked leads (read-only).</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121212]">
          <div className="divide-y divide-white/10">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={`w-full px-4 py-3 text-left hover:bg-white/5 ${activeId === r.id ? "bg-premium-gold/10" : ""}`}
              >
                <p className="text-sm font-medium">
                  {r.lead?.name ?? r.clientUser?.email ?? "Guest"}{" "}
                  <span className="text-xs font-normal text-[#B3B3B3]">
                    {new Date(r.updatedAt).toLocaleString()}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[#B3B3B3]">
                  {r.lastMessage?.content ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  {r.leadId ? (
                    <Link href="/admin/leads" className="text-premium-gold hover:underline">
                      Lead: {r.leadId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-[#737373]">No lead</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {rows.length === 0 ? <p className="p-6 text-sm text-[#B3B3B3]">No conversations.</p> : null}
        </div>

        <div className="min-h-[400px] rounded-2xl border border-white/10 bg-[#121212] p-4">
          {!activeId ? (
            <p className="text-sm text-[#B3B3B3]">Select a thread.</p>
          ) : (
            <div className="max-h-[480px] space-y-3 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                  <span className="text-[10px] uppercase text-premium-gold">{m.sender}</span>
                  <p className="mt-1 whitespace-pre-wrap text-[#E5E5E5]">{m.content}</p>
                  <p className="mt-2 text-[10px] text-[#737373]">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
