"use client";

import { AI_LEGAL_FINANCIAL_NOTICE } from "@/modules/ai/core/ai-guardrails";

type Props = {
  variant?: "default" | "compact";
  /** Extra emphasis on legal/finance screens */
  emphasize?: boolean;
};

export function AIAuditNotice({ variant = "default", emphasize }: Props) {
  const base =
    emphasize === true
      ? "border-amber-500/40 bg-amber-950/50 text-amber-100/95"
      : "border-white/10 bg-white/[0.04] text-slate-400";
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-[11px] leading-snug ${base} ${
        variant === "compact" ? "py-1.5" : ""
      }`}
      role="note"
    >
      {AI_LEGAL_FINANCIAL_NOTICE}
    </p>
  );
}
