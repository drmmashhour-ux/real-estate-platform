"use client";

import type { ExplanationLevel } from "@/modules/autonomous-marketplace/explainability/explainability.types";

export function ExplanationSummaryCard(props: {
  summary: string;
  level: ExplanationLevel;
}) {
  return (
    <div className="rounded-xl border border-premium-gold/25 bg-black/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold">Summary</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-100">{props.summary}</p>
      <p className="mt-2 text-[10px] uppercase text-zinc-500">Level: {props.level}</p>
    </div>
  );
}
