import type { LegalReviewPriorityLevel } from "@/modules/legal/legal-intelligence.types";

const STYLES: Record<LegalReviewPriorityLevel, string> = {
  urgent: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  high: "bg-premium-gold/20 text-premium-gold border-premium-gold/40",
  normal: "bg-slate-500/20 text-slate-200 border-slate-500/40",
  low: "bg-slate-800/50 text-slate-400 border-slate-600/50",
};

export function LegalQueuePriorityBadge({ level }: { level: LegalReviewPriorityLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[level]}`}
    >
      {level}
    </span>
  );
}
