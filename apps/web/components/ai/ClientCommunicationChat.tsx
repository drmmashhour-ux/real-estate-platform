"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientChatContext, QualificationState } from "@/lib/ai/client-communication-chat";
import { ImmoContactCollaborationNotice } from "@/components/immo/ImmoContactCollaborationNotice";
import { LegalAcknowledgmentModal } from "@/components/legal/LegalAcknowledgmentModal";

type Flags = {
  escalateToBroker: boolean;
  escalationReason: string | null;
  qualificationTier: string | null;
  leadReady: boolean;
  missingFields: string[];
};

type Msg = { role: "user" | "assistant"; text: string };

/** Shape of `/api/ai/client-chat` JSON plus fetch meta — explicit so TS allows field access after spread. */
type ClientChatPostResult = {
  __ok: boolean;
  __status: number;
  reply?: string;
  state?: unknown;
  flags?: unknown;
  disclaimer?: string;
  leadId?: string;
  quebecTier?: string;
  code?: string;
  error?: string;
};

function logImmoActivity(eventType: string, listingId?: string | null, metadata?: Record<string, unknown>) {
  fetch("/api/ai/activity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, listingId, metadata }),
  }).catch(() => {});
}

export function ClientCommunicationChat({
  context = {},
  accent = "#10b981",
  defaultOpen = false,
  /** Full-height sheet: no floating launcher; parent owns backdrop. */
  embedded = false,
  /** First message from assistant without user typing (AI-first funnel). */
  autoBootstrap = false,
  /** Passes through to API — enables Immo CRM source + ack email copy. */
  flow,
  variant = "default",
}: {
  context?: Partial<ClientChatContext>;
  accent?: string;
  defaultOpen?: boolean;
  embedded?: boolean;
  autoBootstrap?: boolean;
  flow?: "immo_high_conversion";
  variant?: "default" | "immo";
}) {
  const [open, setOpen] = useState(defaultOpen || embedded);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [state, setState] = useState<QualificationState>({ transcript: [] });
  const [flags, setFlags] = useState<Flags | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);
  const [consentSmsWhatsapp, setConsentSmsWhatsapp] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const requiresImmoAck = flow === "immo_high_conversion";
  const immoNoticeStorageKey =
    requiresImmoAck && context.listingId ? `lecipm_immo_collab_notice_${context.listingId}` : null;
  const [immoAcknowledged, setImmoAcknowledged] = useState(false);
  const [immoNoticeChecked, setImmoNoticeChecked] = useState(false);
  /** Avoid flashing the notice before reading sessionStorage (client). */
  const [immoSessionReady, setImmoSessionReady] = useState(() => !requiresImmoAck);
  const endRef = useRef<HTMLDivElement>(null);
  const bootstrapped = useRef(false);
  const immoInitRef = useRef(false);
  const loggedChatStart = useRef(false);
  const loggedQualified = useRef(false);
  const prevLeadId = useRef<string | undefined>(undefined);
  const [legalBuyerModalOpen, setLegalBuyerModalOpen] = useState(false);
  const [immoInitError, setImmoInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!requiresImmoAck) {
      setImmoSessionReady(true);
      return;
    }
    if (!immoNoticeStorageKey) {
      setImmoSessionReady(true);
      return;
    }
    try {
      if (sessionStorage.getItem(immoNoticeStorageKey) === "1") {
        setImmoAcknowledged(true);
      }
    } catch {
      /* private mode */
    }
    setImmoSessionReady(true);
  }, [requiresImmoAck, immoNoticeStorageKey]);

  useEffect(() => {
    immoInitRef.current = false;
  }, [context.listingId]);

  /** After collaboration notice, register ImmoContact lead + optional messaging thread. */
  useEffect(() => {
    if (!requiresImmoAck || !immoAcknowledged || !immoSessionReady || !context.listingId) return;
    if (immoInitRef.current) return;
    immoInitRef.current = true;
    let cancelled = false;
    (async () => {
      let existing: string | undefined;
      try {
        existing = sessionStorage.getItem(`lecipm_immo_lead_${context.listingId}`) ?? undefined;
      } catch {
        /* private mode */
      }
      const res = await fetch("/api/immo/init-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId: context.listingId,
          collaborationNoticeAccepted: true,
          existingLeadId: existing,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        leadId?: string;
        error?: string;
        code?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        immoInitRef.current = false;
        setImmoInitError(typeof j.error === "string" ? j.error : "Could not start Immo contact session.");
        if (j.code === "BUYER_ACKNOWLEDGMENT_REQUIRED") setLegalBuyerModalOpen(true);
        return;
      }
      setImmoInitError(null);
      if (!j.leadId) return;
      setLeadId(j.leadId);
      try {
        sessionStorage.setItem(`lecipm_immo_lead_${context.listingId}`, j.leadId);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requiresImmoAck, immoAcknowledged, immoSessionReady, context.listingId]);

  const postChat = useCallback(
    async (message: string, nextState: QualificationState, nextLeadId?: string) => {
      const res = await fetch("/api/ai/client-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message,
          state: nextState,
          context,
          leadIdCreated: nextLeadId,
          consentSmsWhatsapp,
          consentVoice,
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
          ...(flow ? { flow } : {}),
          ...(flow === "immo_high_conversion" && immoAcknowledged
            ? { collaborationNoticeAccepted: true }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
        code?: string;
        error?: string;
      };
      return { ...data, __ok: res.ok, __status: res.status } as ClientChatPostResult;
    },
    [context, consentSmsWhatsapp, consentVoice, flow, immoAcknowledged]
  );

  useEffect(() => {
    if (!autoBootstrap || bootstrapped.current) return;
    if (requiresImmoAck && !immoAcknowledged) return;
    if (requiresImmoAck && !leadId) return;
    bootstrapped.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await postChat("", { transcript: [] }, leadId);
        if (cancelled) return;
        if (data.__status === 403 && data.code === "BUYER_ACKNOWLEDGMENT_REQUIRED") {
          setLegalBuyerModalOpen(true);
        }
        if (data.__ok === false && typeof data.error === "string") {
          setMessages([
            {
              role: "assistant",
              text:
                data.code === "BROKER_AGREEMENT_REQUIRED"
                  ? "This listing’s broker must complete the platform broker agreement before chat is available."
                  : data.code === "SIGN_IN_REQUIRED"
                    ? "Please sign in to send messages — required terms apply to Immo contact."
                    : data.error,
            },
          ]);
          return;
        }
        if (typeof data.reply === "string" && data.reply) {
          const replyText = data.reply;
          setMessages([{ role: "assistant", text: replyText }]);
        }
        if (data.state) setState(data.state as QualificationState);
        if (data.flags) setFlags(data.flags as Flags);
        if (typeof data.disclaimer === "string") setDisclaimer(data.disclaimer);
        if (typeof data.leadId === "string") setLeadId(data.leadId);
        if (flow === "immo_high_conversion" && context.listingId && !loggedChatStart.current) {
          loggedChatStart.current = true;
          logImmoActivity("immo_ai_chat_started", context.listingId, { flow });
        }
      } catch {
        if (!cancelled) {
          setMessages([
            { role: "assistant", text: "We couldn't reach the assistant. Please try again or refresh the page." },
          ]);
        }
      } finally {
        setLoading(false);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    })();
    return () => {
      cancelled = true;
      bootstrapped.current = false;
      setLoading(false);
    };
  }, [autoBootstrap, requiresImmoAck, immoAcknowledged, leadId, postChat, flow, context.listingId]);

  const send = useCallback(async () => {
    if (requiresImmoAck && !immoAcknowledged) return;
    const text = input.trim();
    if (!text && messages.length > 0) return;
    setInput("");
    if (text) setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const data = await postChat(text, state, leadId);
      if (data.__status === 403 && data.code === "BUYER_ACKNOWLEDGMENT_REQUIRED") {
        setLegalBuyerModalOpen(true);
      }
      if (data.__ok === false) {
        const errMsg =
          data.code === "BROKER_AGREEMENT_REQUIRED"
            ? "The listing broker must complete the platform broker agreement before messages can be delivered."
            : data.code === "SIGN_IN_REQUIRED"
              ? "Sign in to send messages — Immo contact requires accepted platform terms."
              : typeof data.error === "string"
                ? data.error
                : "Message could not be sent.";
        setMessages((m) => [...m, { role: "assistant", text: errMsg }]);
        return;
      }
      if (typeof data.reply === "string" && data.reply) {
        const replyText = data.reply;
        setMessages((m) => [...m, { role: "assistant", text: replyText }]);
      }
      if (data.state) setState(data.state as QualificationState);
      if (data.flags) setFlags(data.flags as Flags);
      if (typeof data.disclaimer === "string") setDisclaimer(data.disclaimer);
      if (typeof data.leadId === "string") setLeadId(data.leadId);

      if (flow === "immo_high_conversion" && context.listingId) {
        const f = data.flags as Flags | undefined;
        const miss = f?.missingFields ?? [];
        if (
          !loggedQualified.current &&
          f?.qualificationTier &&
          !miss.includes("timeline") &&
          !miss.includes("budget") &&
          !miss.includes("financing") &&
          !miss.includes("contactTime")
        ) {
          loggedQualified.current = true;
          logImmoActivity("immo_ai_qualification_complete", context.listingId, {
            tier: f.qualificationTier,
          });
        }
        if (typeof data.leadId === "string" && data.leadId !== prevLeadId.current) {
          prevLeadId.current = data.leadId;
          logImmoActivity("immo_ai_contact_captured", context.listingId, { leadId: data.leadId });
          if (data.quebecTier === "hot") {
            logImmoActivity("immo_ai_hot_lead", context.listingId, { leadId: data.leadId });
          }
        }
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "We couldn't reach the assistant. Please try again or call the office.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [input, messages.length, state, leadId, postChat, flow, context.listingId, requiresImmoAck, immoAcknowledged]);

  const title = variant === "immo" ? "Property assistant" : "Property assistant (Québec)";
  const subtitle =
    variant === "immo"
      ? "Verified broker network · Fast response"
      : "Not a courtier · No legal, tax, or price negotiation";

  const showImmoNoticeGate = requiresImmoAck && immoSessionReady && !immoAcknowledged;

  const panel = (
    <>
    <div
      className={`flex max-h-[min(560px,85dvh)] w-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl ${
        embedded ? "max-h-[min(640px,88dvh)] sm:max-w-md" : "max-w-md"
      }`}
      style={{ borderColor: `${accent}44` }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}
      >
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[10px] leading-tight text-slate-500">{subtitle}</p>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>

      {requiresImmoAck && !immoSessionReady ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center px-4 py-8">
          <p className="text-xs text-slate-500">Loading…</p>
        </div>
      ) : showImmoNoticeGate ? (
        <div className="flex min-h-[280px] flex-1 flex-col overflow-y-auto px-4 py-3">
          <ImmoContactCollaborationNotice />
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700/80 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-300">
            <input
              type="checkbox"
              checked={immoNoticeChecked}
              onChange={(e) => setImmoNoticeChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 text-[#C9A646] focus:ring-[#C9A646]/40"
            />
            <span>
              I have read this notice and confirm that my contact is initiated through the platform and may be subject
              to applicable collaboration and commission terms.
            </span>
          </label>
          <button
            type="button"
            disabled={!immoNoticeChecked}
            onClick={() => {
              setImmoAcknowledged(true);
              if (immoNoticeStorageKey) {
                try {
                  sessionStorage.setItem(immoNoticeStorageKey, "1");
                } catch {
                  /* ignore */
                }
              }
              logImmoActivity("immo_collaboration_notice_accepted", context.listingId ?? null, { flow });
              bootstrapped.current = false;
            }}
            className="mt-5 w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] transition hover:bg-[#D4B35A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
      {immoInitError ? (
        <p className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-200/90">{immoInitError}</p>
      ) : null}
      <div className="min-h-[180px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !loading && !autoBootstrap && (
          <p className="text-xs text-slate-500">
            Tap below to start — we&apos;ll ask a few quick questions, then connect you with a broker.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 text-sm ${
              msg.role === "user" ? "ml-6 bg-slate-800 text-slate-100" : "mr-4 bg-slate-950/80 text-slate-300"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {loading && <p className="text-xs text-slate-500">Thinking…</p>}
        <div ref={endRef} />
      </div>

      {flags?.qualificationTier && variant !== "immo" && (
        <p className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
          Lead signal:{" "}
          {flags.qualificationTier === "hot" ? "Hot" : flags.qualificationTier === "warm" ? "Warm" : "Cold"}{" "}
          (rule-based)
        </p>
      )}

      <div className="border-t border-slate-800 p-3">
        {leadId ? (
          <p className="text-center text-xs text-slate-500">
            Thanks! A broker will contact you shortly 👍 Usually within a few minutes.
          </p>
        ) : (
          <>
            <div className="mb-2 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-2">
              <p className="text-[10px] font-medium text-slate-400">SMS / voice follow-up (optional)</p>
              <label className="flex items-start gap-2 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={consentSmsWhatsapp}
                  onChange={(e) => setConsentSmsWhatsapp(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I agree to SMS/WhatsApp from the automated assistant (not a licensed broker).</span>
              </label>
              <label className="flex items-start gap-2 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={consentVoice}
                  onChange={(e) => setConsentVoice(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I agree to an automated voice call if my lead is hot (platform may disable).</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                style={{ background: accent }}
              >
                Send
              </button>
            </div>
            {messages.length === 0 && !autoBootstrap && (
              <button
                type="button"
                onClick={() => void send()}
                className="mt-2 w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-400 hover:bg-slate-800"
              >
                Start conversation
              </button>
            )}
          </>
        )}
      </div>

      {disclaimer && (
        <p className="border-t border-slate-800 px-3 py-2 text-[10px] leading-snug text-slate-600">{disclaimer}</p>
      )}
        </>
      )}
    </div>
    <LegalAcknowledgmentModal
      open={legalBuyerModalOpen}
      kind="buyer"
      onClose={() => setLegalBuyerModalOpen(false)}
      onComplete={() => {
        setLegalBuyerModalOpen(false);
        setImmoInitError(null);
        immoInitRef.current = false;
        bootstrapped.current = false;
      }}
    />
    </>
  );

  if (embedded) {
    return panel;
  }

  if (defaultOpen) {
    return panel;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[100vw] flex-col items-end gap-2 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6">
      {open && panel}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-2xl shadow-lg touch-manipulation"
        style={{ background: accent, color: "#0f172a" }}
        aria-label="Open chat"
      >
        💬
      </button>
    </div>
  );
}
