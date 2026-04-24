"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ContractBrainContext } from "@/lib/legal/contract-brain-types";

type NoticePayload = {
  key: string;
  version: string;
  title: string;
  bodyFr: string;
  category: string;
  requiredWhen: string;
};

type Props = {
  contractId: string;
  userId: string;
  context: ContractBrainContext;
  /** Called after all required notices are acknowledged via API */
  onComplete: () => void;
  /** Optional: surface errors to parent */
  onError?: (message: string) => void;
};

/**
 * OACIQ-style limited-role notice gate — expandable cards, mandatory checkbox + read confirmation, then acknowledge.
 */
export function ContractBrainNoticeGate({ contractId, userId, context, onComplete, onError }: Props) {
  const baseId = useId();
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const [notices, setNotices] = useState<NoticePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [understood, setUnderstood] = useState(false);
  const [readConfirmed, setReadConfirmed] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const contextKey = JSON.stringify(context);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/legal/contract-brain/required-notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractId, userId, context }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          onErrorRef.current?.(typeof data.error === "string" ? data.error : "Could not load notices");
          setNotices([]);
          return;
        }
        const list = Array.isArray(data.notices) ? (data.notices as NoticePayload[]) : [];
        setNotices(list);
        const initExpand: Record<string, boolean> = {};
        for (const n of list) initExpand[n.key] = true;
        setExpanded(initExpand);
        if (list.length === 0) {
          onCompleteRef.current();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractId, userId, contextKey]);

  const allReadClicked = notices.length > 0 && notices.every((n) => readConfirmed[n.key]);

  const handleContinue = async () => {
    if (!understood || !allReadClicked) return;
    setSubmitting(true);
    try {
      for (const n of notices) {
        const res = await fetch("/api/legal/contract-brain/acknowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractId, userId, noticeKey: n.key }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          onErrorRef.current?.(typeof data.error === "string" ? data.error : "Acknowledgement failed");
          return;
        }
      }
      onCompleteRef.current();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-xl border border-premium-gold/25 bg-[#0B0B0B]/90 p-6 text-center text-sm text-slate-300"
        role="status"
        aria-live="polite"
      >
        Chargement des avis légaux…
      </div>
    );
  }

  if (notices.length === 0) {
    return null;
  }

  const showUnrepresentedBanner = context.role === "BUYER" || context.role === "TENANT";

  return (
    <div className="space-y-4 rounded-xl border border-premium-gold/30 bg-gradient-to-b from-[#0B0B0B] to-black/95 p-4 shadow-[0_12px_40px_-16px_rgba(212,175,55,0.35)] sm:p-6">
      {showUnrepresentedBanner ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="alert"
        >
          <strong className="font-semibold text-premium-gold">Vous n&apos;êtes pas représenté</strong>
          <span className="text-slate-200"> — rôle limité du courtier</span>
        </div>
      ) : null}

      <ul className="space-y-3">
        {notices.map((n) => {
          const eid = `${baseId}-${n.key}`;
          const isOpen = expanded[n.key] ?? false;
          return (
            <li
              key={n.key}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/60"
                aria-expanded={isOpen}
                aria-controls={`${eid}-panel`}
                id={`${eid}-heading`}
                onClick={() => setExpanded((s) => ({ ...s, [n.key]: !isOpen }))}
              >
                <span>{n.title}</span>
                <span className="text-premium-gold/90" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div
                id={`${eid}-panel`}
                role="region"
                aria-labelledby={`${eid}-heading`}
                hidden={!isOpen}
                className={isOpen ? "border-t border-white/10 px-4 py-3" : "hidden"}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{n.bodyFr}</p>
                <div className="mt-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-premium-gold/50 text-premium-gold focus:ring-premium-gold"
                      checked={readConfirmed[n.key] ?? false}
                      onChange={(ev) =>
                        setReadConfirmed((s) => ({ ...s, [n.key]: ev.target.checked }))
                      }
                    />
                    <span>J&apos;ai lu et compris cet avis.</span>
                  </label>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-premium-gold/20 bg-black/40 px-4 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-premium-gold/50 text-premium-gold focus:ring-premium-gold"
          checked={understood}
          onChange={(ev) => setUnderstood(ev.target.checked)}
        />
        <span>
          Je comprends que le courtier ne me représente pas et que son rôle est limité.
        </span>
      </label>

      <button
        type="button"
        disabled={!understood || !allReadClicked || submitting}
        onClick={() => void handleContinue()}
        className="w-full rounded-lg bg-premium-gold px-4 py-3 text-sm font-semibold text-[#0B0B0B] transition hover:bg-[#E8D5A0] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Enregistrement…" : "Continuer vers la signature"}
      </button>
    </div>
  );
}
