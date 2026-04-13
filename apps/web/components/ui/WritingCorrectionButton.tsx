"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type WriteResponse = {
  text?: string;
  offline?: boolean;
  offlineHint?: string;
  error?: string;
};

/**
 * Calls POST /api/ai/write with action `correct_writing` — spelling and grammar only, same language.
 */
export function WritingCorrectionButton({
  text,
  onApply,
  disabled,
  className,
}: {
  text: string;
  onApply: (corrected: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setHint(null);
  }, [text]);

  const canRun = !disabled && text.trim().length >= 2;

  async function run() {
    if (!canRun) return;
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          prompt: text,
          type: "general",
          action: "correct_writing",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as WriteResponse;
      if (!res.ok) {
        setHint(typeof data.error === "string" ? data.error : "Correction failed");
        return;
      }
      if (typeof data.text === "string") {
        onApply(data.text);
        if (data.offline) {
          setHint(data.offlineHint ?? "Spelling check needs the server AI key — text was not changed.");
        }
      }
    } catch {
      setHint("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-end gap-0.5 ${className ?? ""}`}>
      <button
        type="button"
        title="Fix spelling and grammar (AI) — Corriger l’orthographe et la grammaire"
        disabled={!canRun || loading}
        onClick={() => void run()}
        className="whitespace-nowrap rounded-lg border border-premium-gold/35 bg-premium-gold/10 px-2.5 py-1 text-[11px] font-medium text-premium-gold transition hover:bg-premium-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "…" : "Correct writing"}
      </button>
      {hint ? <span className="max-w-[14rem] text-right text-[10px] text-amber-200/90">{hint}</span> : null}
    </span>
  );
}

/** Label row + correction control for long text fields (seller declarations, etc.). */
export function WritingCorrectionLabelRow({
  label,
  textValue,
  onApply,
  disabled,
}: {
  label: ReactNode;
  textValue: string;
  onApply: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <span className="mb-1 flex flex-wrap items-end justify-between gap-2">
      <span className="min-w-0 flex-1">{label}</span>
      <WritingCorrectionButton text={textValue} onApply={onApply} disabled={disabled} className="shrink-0" />
    </span>
  );
}
