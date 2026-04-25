"use client";

import { QC_CLOSING_STAGES, type QcClosingStage } from "@/modules/quebec-closing/quebec-closing.types";

export function ClosingTimeline({ currentStage }: { currentStage: string | null | undefined }) {
  const idx = currentStage ? QC_CLOSING_STAGES.indexOf(currentStage as QcClosingStage) : -1;

  return (
    <ol className="mt-3 space-y-2">
      {QC_CLOSING_STAGES.map((stage, i) => {
        const done = idx >= 0 && i < idx;
        const active = idx === i;
        return (
          <li
            key={stage}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              active ? "border-ds-gold/50 bg-ds-gold/10 text-ds-text"
              : done ? "border-emerald-500/30 bg-emerald-500/5 text-ds-text-secondary"
              : "border-ds-border bg-black/20 text-ds-text-secondary"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wide">{done ? "✓" : active ? "●" : "○"}</span>
            <span className={active ? "font-semibold" : ""}>{stage.replaceAll("_", " ")}</span>
          </li>
        );
      })}
    </ol>
  );
}
