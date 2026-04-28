"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SYBNB_MESSAGE_MAX_LEN, sybnbMessageContainsHttpUrl } from "@/lib/sybnb/sybnb-message-content";

export type SybnbChatMessageDto = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  riskLevel?: string | null;
  riskFlags?: unknown;
};

type Props = {
  bookingId: string;
  viewerUserId: string;
  guestId: string;
  hostId: string;
  /** Only booking guest or host may send; admins read-only. */
  canSend: boolean;
  /** Host-only: show smart reply chips (rules + optional AI). */
  suggestionsEnabled?: boolean;
};

function messageShowsRiskBadge(m: SybnbChatMessageDto): boolean {
  return m.riskLevel === "medium" || m.riskLevel === "high";
}

export function ChatBox({
  bookingId,
  viewerUserId,
  guestId,
  hostId,
  canSend,
  suggestionsEnabled = false,
}: Props) {
  const t = useTranslations("Sybnb.chat");
  const locale = useLocale();
  const [messages, setMessages] = useState<SybnbChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [urlWarn, setUrlWarn] = useState(false);
  const [riskModal, setRiskModal] = useState<{ prompt: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const load = useCallback(async () => {
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
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setError(t("loadError"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
  }, [suggestionsEnabled, canSend, bookingId, locale, messages.length]);

  async function postMessage(trimmed: string, confirmRisk: boolean): Promise<
    | { kind: "sent"; message: SybnbChatMessageDto }
    | { kind: "warn"; prompt: string }
    | { kind: "error" }
  > {
    const res = await fetch("/api/sybnb/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        content: trimmed,
        ...(confirmRisk ? { confirmRisk: true } : {}),
      }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      warning?: boolean;
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
  }

  async function send() {
    if (!canSend || sending) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const result = await postMessage(trimmed, false);
      if (result.kind === "warn") {
        setRiskModal({ prompt: result.prompt });
        return;
      }
      if (result.kind === "error") {
        throw new Error("send_failed");
      }
      setMessages((prev) => [...prev, result.message]);
      setDraft("");
      setUrlWarn(false);
    } catch {
      setError(t("sendError"));
    } finally {
      setSending(false);
    }
  }

  async function confirmRiskSend() {
    if (!canSend || sending || !riskModal) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const result = await postMessage(trimmed, true);
      if (result.kind === "warn") {
        setRiskModal({ prompt: result.prompt });
        return;
      }
      if (result.kind === "error") {
        throw new Error("send_failed");
      }
      setRiskModal(null);
      setMessages((prev) => [...prev, result.message]);
      setDraft("");
      setUrlWarn(false);
    } catch {
      setError(t("sendError"));
    } finally {
      setSending(false);
    }
  }

  function cancelRiskModal() {
    setRiskModal(null);
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

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm [dir=rtl]:text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{t("title")}</p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500">{t("privacyNote")}</p>
      {!canSend ? <p className="mt-2 text-xs font-medium text-amber-900">{t("adminReadOnly")}</p> : null}

      <div
        className="mt-4 max-h-[min(420px,55vh)] space-y-3 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/90 p-3"
        aria-live="polite"
      >
        {loading ? (
          <p className="text-center text-xs text-neutral-500">…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-neutral-500">{t("empty")}</p>
        ) : (
          messages.map((m) => {
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
                    <span className="font-mono font-normal text-neutral-400">
                      {new Date(m.createdAt).toISOString().slice(11, 16)} UTC
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
                disabled={sending || !draft.trim()}
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
