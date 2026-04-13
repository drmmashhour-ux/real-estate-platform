"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RequestVisitModal } from "@/components/visits/RequestVisitModal";

type ThreadRow = {
  id: string;
  status: string;
  lastMessageAt: string;
  listing: { id: string; title: string; listingCode: string } | null;
  preview: string;
  unreadCount: number;
};

type Slot = { start: string; end: string };

type ThreadDetail = {
  crmLeadId?: string | null;
  thread: {
    id: string;
    status: string;
    listing: { id: string; title: string; listingCode: string } | null;
    broker: { name: string | null };
  };
  counterpartyLabel: string;
  messages: Array<{
    id: string;
    body: string;
    senderRole: string;
    senderName: string | null;
    createdAt: string;
  }>;
};

export function LecipmCustomerMessagesClient({ initialThreadId }: { initialThreadId?: string }) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId ?? null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitSlots, setVisitSlots] = useState<Slot[]>([]);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/messages/threads", { credentials: "same-origin" });
    const j = (await res.json()) as { threads?: ThreadRow[]; error?: string };
    if (!res.ok) throw new Error(j.error ?? "Could not load messages");
    setThreads(Array.isArray(j.threads) ? j.threads : []);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadList();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadList]);

  const loadThread = useCallback(
    async (id: string) => {
      setLoadingThread(true);
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

  useEffect(() => {
    const lid = detail?.thread.listing?.id;
    const leadOk = Boolean(detail?.crmLeadId);
    if (!lid || !leadOk) {
      setVisitSlots([]);
      return;
    }
    let cancelled = false;
    const from = new Date();
    const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    const q = new URLSearchParams({
      listingId: lid,
      from: from.toISOString(),
      to: to.toISOString(),
      durationMinutes: "45",
    });
    void fetch(`/api/visits/slots?${q.toString()}`)
      .then((r) => r.json())
      .then((j: { slots?: Slot[] }) => {
        if (cancelled) return;
        setVisitSlots(Array.isArray(j.slots) ? j.slots.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancelled) setVisitSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.thread.listing?.id, detail?.crmLeadId]);

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

  return (
    <div className="flex min-h-[60vh] flex-col gap-0 md:flex-row">
      <aside
        className={`w-full border-b border-white/10 md:w-[300px] md:border-b-0 md:border-r md:pr-2 ${
          selectedId ? "hidden md:block" : ""
        }`}
      >
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Inbox</p>
        <div className="max-h-[38vh] overflow-y-auto md:max-h-[calc(100vh-12rem)]">
          {loading ? (
            <p className="px-3 text-sm text-slate-500">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="px-3 text-sm text-slate-500">No messages yet.</p>
          ) : (
            <ul>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left text-sm hover:bg-white/5 ${
                      selectedId === t.id ? "bg-white/[0.06]" : ""
                    }`}
                  >
                    <span className="line-clamp-1 font-medium text-white">
                      {t.listing?.title ?? "Conversation"}
                    </span>
                    <span className="line-clamp-1 text-xs text-slate-500">{t.preview}</span>
                    {t.unreadCount > 0 ? (
                      <span className="w-fit rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                        {t.unreadCount} new
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      <section className="min-w-0 flex-1 px-3 py-3 md:px-6">
        {selectedId ? (
          <button
            type="button"
            className="mb-3 text-sm text-premium-gold hover:underline md:hidden"
            onClick={() => setSelectedId(null)}
          >
            ← Back to threads
          </button>
        ) : null}
        {!selectedId ? (
          <p className="text-sm text-slate-500">Choose a conversation.</p>
        ) : loadingThread && !detail ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : detail ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">{detail.thread.listing?.title ?? "Message"}</h2>
              {detail.thread.listing ? (
                <Link
                  href={`/listings/${detail.thread.listing.id}`}
                  className="text-xs text-premium-gold hover:underline"
                >
                  View listing
                </Link>
              ) : null}
              {detail.crmLeadId && detail.thread.listing ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitOpen(true)}
                    className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-medium text-[#E8D589] hover:bg-[#D4AF37]/20"
                  >
                    Request a visit
                  </button>
                  <Link
                    href={`/listings/${detail.thread.listing.id}/offer`}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10"
                  >
                    Make an offer
                  </Link>
                  <button
                    type="button"
                    onClick={() => replyRef.current?.focus()}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                  >
                    Ask a question
                  </button>
                </div>
              ) : null}
              {visitSlots.length > 0 && detail?.thread.listing ? (
                <div className="mt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suggested times</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {visitSlots.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => {
                          const start = new Date(s.start);
                          setReply(
                            `I'd like to schedule a visit around ${start.toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}. `
                          );
                          requestAnimationFrame(() => replyRef.current?.focus());
                        }}
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-slate-200 hover:border-[#D4AF37]/40"
                      >
                        {new Date(s.start).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="mt-2 text-sm text-slate-400">
                {detail.counterpartyLabel} — The broker will reply as soon as possible.
              </p>
            </div>
            <div className="space-y-3">
              {detail.messages.map((m) => {
                const mine = m.senderRole === "customer" || m.senderRole === "guest";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[min(100%,480px)] rounded-2xl px-4 py-2 text-sm ${
                        mine ? "bg-premium-gold/90 text-black" : "bg-white/10 text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                ref={replyRef}
                className="min-h-[88px] flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="Reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={() => void sendReply()}
                className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </section>
      {detail?.crmLeadId && detail.thread.listing ? (
        <RequestVisitModal
          open={visitOpen}
          onClose={() => setVisitOpen(false)}
          listingId={detail.thread.listing.id}
          listingTitle={detail.thread.listing.title}
          leadId={detail.crmLeadId}
          threadId={detail.thread.id}
        />
      ) : null}
    </div>
  );
}
