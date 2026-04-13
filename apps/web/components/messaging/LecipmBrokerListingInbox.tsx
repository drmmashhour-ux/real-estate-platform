"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ThreadRow = {
  id: string;
  status: string;
  source: string;
  subject: string | null;
  lastMessageAt: string;
  listing: { id: string; title: string; listingCode: string } | null;
  guestName: string | null;
  customerUserId: string | null;
  preview: string;
  lastMessageRole: string | null;
  unreadCount: number;
};

type ThreadDetail = {
  thread: {
    id: string;
    status: string;
    subject: string | null;
    listing: { id: string; title: string; listingCode: string } | null;
    guestName: string | null;
    guestEmail: string | null;
    broker: { id: string; name: string | null; email: string | null };
    customer: { id: string; name: string | null; email: string | null } | null;
  };
  counterpartyLabel: string;
  responseStats?: {
    avgResponseMs: number | null;
    medianResponseMs: number | null;
    brokerReplySamples: number;
  };
  messages: Array<{
    id: string;
    body: string;
    senderRole: string;
    senderName: string | null;
    createdAt: string;
  }>;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "open", label: "Open" },
  { id: "replied", label: "Broker replied" },
  { id: "closed", label: "Closed" },
] as const;

function statusLabel(status: string): string {
  if (status === "closed") return "Conversation closed";
  if (status === "replied") return "Broker replied";
  return "Open";
}

function formatResponseMs(ms: number | null): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 120) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export function LecipmBrokerListingInbox({ initialThreadId }: { initialThreadId?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId ?? null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filter === "unread") p.set("unread", "1");
    else if (filter !== "all") p.set("status", filter);
    return p.toString();
  }, [filter]);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/messages/threads?${query}`, { credentials: "same-origin" });
    const j = (await res.json()) as { threads?: ThreadRow[]; error?: string };
    if (!res.ok) throw new Error(j.error ?? "Could not load inbox");
    setThreads(Array.isArray(j.threads) ? j.threads : []);
  }, [query]);

  useEffect(() => {
    void (async () => {
      setLoadingList(true);
      setError(null);
      try {
        await loadList();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [loadList]);

  const loadThread = useCallback(
    async (id: string) => {
      setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(`/api/messages/threads/${encodeURIComponent(id)}`, {
          credentials: "same-origin",
        });
        const j = (await res.json()) as ThreadDetail & { error?: string };
        if (!res.ok) throw new Error(j.error ?? "Could not load conversation");
        setDetail(j as ThreadDetail);
        await fetch(`/api/messages/threads/${encodeURIComponent(id)}/read`, {
          method: "POST",
          credentials: "same-origin",
        }).catch(() => {});
        void loadList();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
        setDetail(null);
      } finally {
        setLoadingThread(false);
      }
    },
    [loadList]
  );

  useEffect(() => {
    if (initialThreadId) setSelectedId(initialThreadId);
  }, [initialThreadId]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
  }, [selectedId, loadThread]);

  async function sendReply() {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/threads/${encodeURIComponent(selectedId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body: reply.trim() }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Send failed");
      setReply("");
      await loadThread(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function closeThread() {
    if (!selectedId) return;
    const res = await fetch(`/api/messages/threads/${encodeURIComponent(selectedId)}/close`, {
      method: "POST",
      credentials: "same-origin",
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(j.error ?? "Could not close");
      return;
    }
    await loadThread(selectedId);
    void loadList();
  }

  const activeTitle = detail?.thread.listing?.title ?? "Inbox";

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-0 md:flex-row">
      <aside
        className={`w-full border-b border-white/10 md:w-[min(100%,380px)] md:border-b-0 md:border-r ${
          selectedId ? "hidden md:block" : ""
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing inquiries</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === f.id ? "bg-premium-gold text-black" : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[40vh] overflow-y-auto md:max-h-[calc(100vh-10rem)]">
          {loadingList ? (
            <p className="p-4 text-sm text-slate-500">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition hover:bg-white/5 ${
                      selectedId === t.id ? "bg-white/[0.07]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-white">
                        {t.guestName ? t.guestName : "Customer"}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {new Date(t.lastMessageAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {t.listing ? (
                      <span className="line-clamp-1 text-xs text-premium-gold/90">{t.listing.title}</span>
                    ) : null}
                    <p className="line-clamp-2 text-xs text-slate-400">{t.preview}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {t.unreadCount > 0 ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          {t.unreadCount} new
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                        {statusLabel(t.status)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-[50vh] min-w-0 flex-1 flex-col">
        {selectedId ? (
          <button
            type="button"
            className="mb-2 px-4 pt-2 text-sm text-premium-gold hover:underline md:hidden"
            onClick={() => setSelectedId(null)}
          >
            ← Back to threads
          </button>
        ) : null}
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
            Select a conversation to read and reply.
          </div>
        ) : loadingThread && !detail ? (
          <p className="p-6 text-sm text-slate-500">Loading conversation…</p>
        ) : detail ? (
          <>
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">{activeTitle}</h2>
              {detail.thread.listing ? (
                <Link
                  href={`/listings/${detail.thread.listing.id}`}
                  className="mt-1 inline-block text-xs text-premium-gold hover:underline"
                >
                  View listing
                </Link>
              ) : null}
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
                <p className="font-medium text-slate-200">{detail.counterpartyLabel}</p>
                {detail.thread.guestEmail ? (
                  <p className="mt-1 text-slate-400">{detail.thread.guestEmail}</p>
                ) : detail.thread.customer?.email ? (
                  <p className="mt-1 text-slate-400">{detail.thread.customer.email}</p>
                ) : null}
                {detail.responseStats &&
                detail.responseStats.brokerReplySamples > 0 &&
                formatResponseMs(detail.responseStats.medianResponseMs) ? (
                  <p className="mt-2 text-slate-500">
                    Your median reply time in this thread:{" "}
                    <span className="font-medium text-slate-300">
                      {formatResponseMs(detail.responseStats.medianResponseMs)}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      ({detail.responseStats.brokerReplySamples}{" "}
                      {detail.responseStats.brokerReplySamples === 1 ? "reply" : "replies"})
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {detail.messages.map((m) => {
                const mine = m.senderRole === "broker" || m.senderRole === "admin";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[min(100%,520px)] rounded-2xl px-4 py-2 text-sm ${
                        mine ? "bg-premium-gold/90 text-black" : "bg-white/10 text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {m.senderName ?? m.senderRole} · {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  className="min-h-[88px] flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                  placeholder="Write a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void closeThread()}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    Close thread
                  </button>
                  <button
                    type="button"
                    disabled={sending || !reply.trim()}
                    onClick={() => void sendReply()}
                    className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="p-6 text-sm text-red-400">{error ?? "Could not load thread"}</p>
        )}
      </section>
    </div>
  );
}
