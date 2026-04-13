"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type InboxRow = {
  id: string;
  listingTitle: string;
  listingCode: string | null;
  city: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  otherParticipant: { id: string; name: string | null; email: string };
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string };
};

export function MessagesClient({
  viewerId,
  hostId,
  listingId,
  listingCode,
  initialThreadId,
}: {
  viewerId: string | null;
  hostId?: string;
  listingId?: string;
  listingCode?: string | null;
  initialThreadId?: string;
}) {
  const idLine = listingCode ? `[Listing ${listingCode}]\n` : "";
  const [message, setMessage] = useState(idLine);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!viewerId) return;
    setInboxLoading(true);
    try {
      const res = await fetch("/api/bnhub/inbox", { credentials: "same-origin" });
      const j = (await res.json()) as { threads?: InboxRow[] };
      if (res.ok && Array.isArray(j.threads)) {
        setInbox(j.threads);
      }
    } finally {
      setInboxLoading(false);
    }
  }, [viewerId]);

  const loadThread = useCallback(async (threadId: string) => {
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/bnhub/messages?threadId=${encodeURIComponent(threadId)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as { messages?: ChatMessage[] };
      if (res.ok && Array.isArray(j.messages)) {
        setThreadMessages(j.messages);
        await fetch("/api/bnhub/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ threadId }),
        }).catch(() => {});
        void loadInbox();
      }
    } finally {
      setThreadLoading(false);
    }
  }, [loadInbox]);

  useEffect(() => {
    setMessage(idLine);
  }, [idLine]);

  useEffect(() => {
    if (viewerId) void loadInbox();
  }, [viewerId, loadInbox]);

  useEffect(() => {
    if (activeThreadId) void loadThread(activeThreadId);
  }, [activeThreadId, loadThread]);

  useEffect(() => {
    if (initialThreadId) setActiveThreadId(initialThreadId);
  }, [initialThreadId]);

  async function sendThreadReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThreadId || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch("/api/bnhub/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ threadId: activeThreadId, body: replyText.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setReplyText("");
      void loadThread(activeThreadId);
      void loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!hostId || !message.trim() || !viewerId) return;
    if (!listingId) {
      setError("Missing listing — open Messages from a stay page.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ hostId, listingId, body: message.trim() }),
      });
      const data = (await res.json()) as { error?: string; threadId?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
      setMessage(idLine);
      if (data.threadId) {
        setActiveThreadId(data.threadId);
        void loadThread(data.threadId);
      }
      void loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  if (!viewerId) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-slate-400">Sign in to message hosts and see your inbox.</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Stay inquiries</h2>
        <p className="mt-1 text-xs text-slate-500">Pre-booking threads with hosts (BNHUB).</p>
        {inboxLoading ? (
          <p className="mt-3 text-xs text-slate-500">Loading…</p>
        ) : inbox.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No threads yet.</p>
        ) : (
          <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
            {inbox.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveThreadId(t.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                    activeThreadId === t.id ? "bg-emerald-500/20 text-emerald-200" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className="block font-medium">{t.listingTitle}</span>
                  <span className="text-slate-500">{t.otherParticipant.name ?? t.otherParticipant.email}</span>
                  {t.unreadCount > 0 ? (
                    <span className="ml-2 rounded-full bg-rose-600 px-1.5 text-[10px] text-white">{t.unreadCount}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/messages" className="mt-4 block text-xs text-premium-gold hover:underline">
          Broker &amp; CRM messages (dashboard) →
        </Link>
      </div>

      <div className="space-y-4">
        {activeThreadId ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Thread</h3>
            {threadLoading ? (
              <p className="mt-2 text-xs text-slate-500">Loading messages…</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
                {threadMessages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg px-3 py-2 ${
                      m.sender.id === viewerId ? "ml-8 bg-emerald-900/40 text-emerald-50" : "mr-8 bg-slate-800/80 text-slate-200"
                    }`}
                  >
                    <p className="text-[10px] text-slate-500">{m.sender.name ?? m.sender.email}</p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={sendThreadReply} className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="submit"
                disabled={replyLoading || !replyText.trim()}
                className="self-end rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                {replyLoading ? "Sending…" : "Send reply"}
              </button>
            </form>
          </div>
        ) : null}

        {hostId ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-slate-200">Contact host</h2>
            <p className="mt-1 text-sm text-slate-400">
              Send a message about this listing. The host replies on the platform — no need for external apps.
            </p>
            {listingCode ? (
              <p className="mt-2 text-xs text-slate-500">
                Listing ID <span className="font-mono text-slate-300">{listingCode}</span>
              </p>
            ) : null}
            {sent && (
              <p className="mt-3 text-sm text-emerald-400">Message sent. You can continue the thread above when the host replies.</p>
            )}
            <form onSubmit={handleSend} className="mt-4 space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about availability, amenities, check-in..."
                rows={4}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <p className="text-slate-400">Select a stay or open a thread from the left.</p>
            <Link href="/bnhub" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Browse stays →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
