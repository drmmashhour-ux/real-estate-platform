"use client";

/**
 * Booking-scoped SYBNB chat (guest ↔ host). Loads/sends via `/api/sybnb/messages` — session-bound, audited server-side.
 *
 * - Offline: unified queue `sybnb_sync_queue` + global `SybnbSyncProvider` sequential sync.
 * - `clientRequestId` (queue row id) + `clientId` (device) on POST dedupe retries via API.
 */

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  SYBNB_MESSAGE_MAX_LEN,
  normalizeSybnbMessageContent,
  sybnbMessageContainsHttpUrl,
} from "@/lib/sybnb/sybnb-message-content";
import { analyzeMessage, analysisNeedsUserConfirmation } from "@/lib/sybnb/chat-fraud";
import {
  enqueueSybnbSyncItem,
  pendingMessagesForBooking,
  readSybnbSyncQueue,
  upsertSybnbSyncItem,
} from "@/lib/sybnb/sync-queue";
import { getClientId } from "@/lib/sybnb/sync-client-id";
import { useSybnbSync } from "@/components/sybnb/SybnbSyncProvider";
import { TrustBadge } from "@/components/sybnb/TrustBadge";

export type SybnbChatMessageDto = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  riskLevel?: string | null;
  riskFlags?: unknown;
  clientId?: string | null;
};

type DeliveryState = "pending" | "sent" | "failed";

type ChatDisplayRow = SybnbChatMessageDto & {
  delivery?: DeliveryState;
};

type Props = {
  bookingId: string;
  viewerUserId: string;
  guestId: string;
  hostId: string;
  guestTrustScore: number;
  hostTrustScore: number;
  /** Only booking guest or host may send; admins read-only. */
  canSend: boolean;
  /** Host-only: show smart reply chips (rules + optional AI). */
  suggestionsEnabled?: boolean;
};

function messageShowsRiskBadge(m: Pick<SybnbChatMessageDto, "riskLevel">): boolean {
  return m.riskLevel === "medium" || m.riskLevel === "high";
}

function mergeChatDisplay(
  remote: SybnbChatMessageDto[],
  optimistic: { clientId: string; content: string; createdAt: string }[],
  bookingId: string,
  viewerUserId: string,
): ChatDisplayRow[] {
  const serverClientIds = new Set(remote.map((m) => m.clientId).filter(Boolean) as string[]);

  const out: ChatDisplayRow[] = remote.map((m) => ({
    ...m,
    delivery: m.senderId === viewerUserId ? ("sent" as const) : undefined,
  }));

  for (const o of optimistic) {
    if (serverClientIds.has(o.clientId)) continue;
    out.push({
      id: `opt-${o.clientId}`,
      senderId: viewerUserId,
      content: o.content,
      createdAt: o.createdAt,
      clientId: o.clientId,
      riskLevel: null,
      delivery: "pending",
    });
  }

  const q = pendingMessagesForBooking(bookingId);
  for (const item of q) {
    if (serverClientIds.has(item.id)) continue;
    if (optimistic.some((o) => o.clientId === item.id)) continue;
    out.push({
      id: `q-${item.id}`,
      senderId: viewerUserId,
      content: String(item.payload.content ?? ""),
      createdAt: new Date(item.createdAt).toISOString(),
      clientId: item.id,
      riskLevel: null,
      delivery: item.failed ? "failed" : "pending",
    });
  }

  out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return out;
}

export function ChatBox({
  bookingId,
  viewerUserId,
  guestId,
  hostId,
  guestTrustScore,
  hostTrustScore,
  canSend,
  suggestionsEnabled = false,
}: Props) {
  const t = useTranslations("Sybnb.chat");
  const tt = useTranslations("Sybnb.trust");
  const locale = useLocale();
  const { subscribeRefresh, runSyncNow } = useSybnbSync();

  const [remoteMessages, setRemoteMessages] = useState<SybnbChatMessageDto[]>([]);
  const [optimistic, setOptimistic] = useState<{ clientId: string; content: string; createdAt: string }[]>([]);
  const [queueEpoch, setQueueEpoch] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlWarn, setUrlWarn] = useState(false);
  const [riskModal, setRiskModal] = useState<{ prompt: string } | null>(null);
  const pendingRiskRef = useRef<{ clientId: string; content: string } | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = useMemo(
    () => mergeChatDisplay(remoteMessages, optimistic, bookingId, viewerUserId),
    [remoteMessages, optimistic, bookingId, viewerUserId, queueEpoch],
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadRemote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sybnb/messages?bookingId=${encodeURIComponent(bookingId)}`, {
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        success?: boolean;
        messages?: SybnbChatMessageDto[];
        error?: string;
      };
      if (!res.ok || data.success === false) {
        throw new Error(typeof data.error === "string" ? data.error : "load_failed");
      }
      const rows = Array.isArray(data.messages) ? data.messages : [];
      setRemoteMessages(rows);
      setOptimistic((prev) => prev.filter((o) => !rows.some((m) => m.clientId === o.clientId)));
    } catch {
      setError(t("loadError"));
      setRemoteMessages([]);
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    void loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  useEffect(() => {
    if (!suggestionsEnabled || !canSend) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/sybnb/chat-suggestions?bookingId=${encodeURIComponent(bookingId)}&locale=${encodeURIComponent(locale)}`,
          { credentials: "same-origin" },
        );
        const data = (await res.json()) as {
          success?: boolean;
          suggestions?: string[];
        };
        if (cancelled) return;
        if (res.ok && data.success !== false && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [suggestionsEnabled, canSend, bookingId, locale, remoteMessages.length]);

  const postMessageRequest = useCallback(
    async (
      trimmed: string,
      confirmRisk: boolean,
      clientId: string,
    ): Promise<
      | { kind: "sent"; message: SybnbChatMessageDto }
      | { kind: "warn"; prompt: string }
      | { kind: "error" }
    > => {
      const res = await fetch("/api/sybnb/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Request-Id": clientId,
        },
        body: JSON.stringify({
          bookingId,
          content: trimmed,
          clientRequestId: clientId,
          clientId: getClientId(),
          ...(confirmRisk ? { confirmRisk: true } : {}),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        warning?: boolean;
        duplicate?: boolean;
        message?: SybnbChatMessageDto | string;
        error?: string;
      };

      if (!res.ok) {
        return { kind: "error" };
      }

      if (data.success === false && data.warning === true) {
        const prompt =
          typeof data.message === "string" && data.message.trim().length > 0 ? data.message : t("riskDefaultPrompt");
        return { kind: "warn", prompt };
      }

      if (
        data.success === true &&
        data.message &&
        typeof data.message === "object" &&
        "id" in data.message
      ) {
        return { kind: "sent", message: data.message as SybnbChatMessageDto };
      }

      return { kind: "error" };
    },
    [bookingId, t],
  );

  const bumpQueue = useCallback(() => {
    setQueueEpoch((e) => e + 1);
  }, []);

  useEffect(() => {
    const unsub = subscribeRefresh(() => {
      bumpQueue();
      void loadRemote();
    });
    return unsub;
  }, [subscribeRefresh, bumpQueue, loadRemote]);

  async function send() {
    if (!canSend || sending) return;
    const trimmed = draft.trim();
    const normalized = normalizeSybnbMessageContent(trimmed);
    if (!normalized.ok) return;

    const analysis = analyzeMessage(normalized.content);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    if (offline) {
      if (analysisNeedsUserConfirmation(analysis)) {
        setError(t("offlineRiskBlocked"));
        return;
      }
      const clientId = crypto.randomUUID();
      enqueueSybnbSyncItem({
        id: clientId,
        type: "message",
        payload: {
          bookingId,
          content: normalized.content,
        },
      });
      bumpQueue();
      setDraft("");
      setUrlWarn(false);
      setError(null);
      return;
    }

    const clientId = crypto.randomUUID();
    pendingRiskRef.current = null;

    setSending(true);
    setError(null);
    const createdAt = new Date().toISOString();
    setOptimistic((prev) => [...prev.filter((o) => o.clientId !== clientId), { clientId, content: normalized.content, createdAt }]);

    try {
      const result = await postMessageRequest(normalized.content, false, clientId);
      if (result.kind === "warn") {
        setRiskModal({
          prompt: result.prompt,
        });
        pendingRiskRef.current = { clientId, content: normalized.content };
        return;
      }
      if (result.kind === "error") {
        setOptimistic((prev) => prev.filter((o) => o.clientId !== clientId));
        enqueueSybnbSyncItem({
          id: clientId,
          type: "message",
          payload: {
            bookingId,
            content: normalized.content,
          },
        });
        bumpQueue();
        setError(t("sendError"));
        return;
      }
      setOptimistic((prev) => prev.filter((o) => o.clientId !== clientId));
      setDraft("");
      setUrlWarn(false);
      await loadRemote();
    } catch {
      setOptimistic((prev) => prev.filter((o) => o.clientId !== clientId));
      enqueueSybnbSyncItem({
        id: clientId,
        type: "message",
        payload: {
          bookingId,
          content: normalized.content,
        },
      });
      bumpQueue();
      setError(t("sendError"));
    } finally {
      setSending(false);
    }
  }

  async function confirmRiskSend() {
    if (!canSend || sending || !riskModal) return;
    const pair = pendingRiskRef.current;
    if (!pair) return;

    setSending(true);
    setError(null);
    try {
      const result = await postMessageRequest(pair.content, true, pair.clientId);
      if (result.kind === "warn") {
        setRiskModal({ prompt: result.prompt });
        return;
      }
      if (result.kind === "error") {
        throw new Error("send_failed");
      }
      setRiskModal(null);
      pendingRiskRef.current = null;
      setOptimistic((prev) => prev.filter((o) => o.clientId !== pair.clientId));
      setDraft("");
      setUrlWarn(false);
      await loadRemote();
    } catch {
      setRiskModal(null);
      pendingRiskRef.current = null;
      const createdAt = new Date().toISOString();
      enqueueSybnbSyncItem({
        id: pair.clientId,
        type: "message",
        payload: {
          bookingId,
          content: pair.content,
        },
      });
      bumpQueue();
      setOptimistic((prev) => prev.filter((o) => o.clientId !== pair.clientId));
      setError(t("sendError"));
    } finally {
      setSending(false);
    }
  }

  function cancelRiskModal() {
    const pair = pendingRiskRef.current;
    setRiskModal(null);
    pendingRiskRef.current = null;
    if (pair) {
      setOptimistic((prev) => prev.filter((o) => o.clientId !== pair.clientId));
    }
  }

  function retryQueued(clientId: string) {
    const row = readSybnbSyncQueue().find((x) => x.id === clientId);
    if (!row || row.type !== "message") return;
    upsertSybnbSyncItem({ ...row, failed: false, retries: 0 });
    bumpQueue();
    void runSyncNow();
  }

  function onDraftChange(v: string) {
    setDraft(v.slice(0, SYBNB_MESSAGE_MAX_LEN));
    setUrlWarn(sybnbMessageContainsHttpUrl(v));
  }

  function senderLabel(senderId: string): string {
    if (senderId === guestId) return t("labelsGuest");
    if (senderId === hostId) return t("labelsHost");
    return "";
  }

  function deliveryUi(m: ChatDisplayRow): ReactNode {
    if (m.senderId !== viewerUserId || !m.delivery) return null;
    if (m.delivery === "pending") {
      return (
        <span className="text-neutral-500" title={t("deliveryPending")} aria-label={t("deliveryPending")}>
          ⏳ <span className="sr-only">{t("deliveryPending")}</span>
        </span>
      );
    }
    if (m.delivery === "sent") {
      return (
        <span className="text-emerald-700" title={t("deliverySent")} aria-label={t("deliverySent")}>
          ✔ <span className="sr-only">{t("deliverySent")}</span>
        </span>
      );
    }
    return (
      <button
        type="button"
        className="text-red-700 underline decoration-dotted underline-offset-2 hover:text-red-900"
        title={t("deliveryRetryHint")}
        aria-label={t("deliveryFailed")}
        onClick={() => retryQueued(m.clientId!)}
      >
        ❌ <span className="sr-only">{t("deliveryFailed")}</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm [dir=rtl]:text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{t("title")}</p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500">{t("privacyNote")}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-neutral-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-neutral-600">{tt("chatGuest")}</span>
          <TrustBadge trustScore={guestTrustScore} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-neutral-600">{tt("chatHost")}</span>
          <TrustBadge trustScore={hostTrustScore} />
        </span>
      </div>
      {!canSend ? <p className="mt-2 text-xs font-medium text-amber-900">{t("adminReadOnly")}</p> : null}

      <div
        className="mt-4 max-h-[min(420px,55vh)] space-y-3 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/90 p-3"
        aria-live="polite"
      >
        {loading ? (
          <p className="text-center text-xs text-neutral-500">…</p>
        ) : displayMessages.length === 0 ? (
          <p className="text-center text-xs text-neutral-500">{t("empty")}</p>
        ) : (
          displayMessages.map((m) => {
            const mine = m.senderId === viewerUserId;
            const risky = messageShowsRiskBadge(m);
            return (
              <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-amber-100 text-amber-950" : "bg-white text-neutral-900 ring-1 ring-neutral-200"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    <span className="flex items-center gap-1">
                      {risky ? (
                        <span title={t("unsafeTooltip")} className="cursor-help text-base leading-none" aria-label={t("unsafeTooltip")}>
                          ⚠️
                        </span>
                      ) : null}
                      <span>{mine ? t("you") : senderLabel(m.senderId)}</span>
                    </span>
                    <span className="flex items-center gap-2 font-mono font-normal text-neutral-400">
                      {deliveryUi(m)}
                      <span>{new Date(m.createdAt).toISOString().slice(11, 16)} UTC</span>
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {urlWarn ? (
        <p className="mt-2 text-[11px] font-medium text-amber-900">{t("linkHint")}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}

      {suggestionsEnabled && canSend && (suggestionsLoading || suggestions.length > 0) ? (
        <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">{t("suggestedRepliesTitle")}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">{t("suggestedRepliesHint")}</p>
          {suggestionsLoading ? (
            <p className="mt-2 text-xs text-neutral-400">…</p>
          ) : suggestions.length === 0 ? null : (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((line, i) => (
                <button
                  key={`${i}-${line.slice(0, 24)}`}
                  type="button"
                  disabled={sending}
                  onClick={() => onDraftChange(line)}
                  className="max-w-full rounded-full border border-amber-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
                >
                  {line}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {canSend ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("placeholder")}</span>
            <textarea
              rows={3}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder={t("placeholder")}
              className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              disabled={sending}
            />
          </label>
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
            className="shrink-0 rounded-xl bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {sending ? t("sending") : t("send")}
          </button>
        </div>
      ) : null}

      {riskModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sybnb-chat-risk-title"
        >
          <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h2 id="sybnb-chat-risk-title" className="text-base font-semibold text-neutral-900">
              {t("riskModalTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-700">{riskModal.prompt}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                onClick={cancelRiskModal}
                disabled={sending}
              >
                {t("riskCancel")}
              </button>
              <button
                type="button"
                className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
                onClick={() => void confirmRiskSend()}
                disabled={sending}
              >
                {sending ? t("sending") : t("riskContinue")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
