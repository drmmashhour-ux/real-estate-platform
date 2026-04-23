"use client";

import type { MarketGap } from "../market-domination.types";

type Props = { gap: MarketGap; territoryName?: string };

const severityStyle = {
  watch: "border-zinc-600 bg-zinc-900/60 text-zinc-300",
  important: "border-amber-700/60 bg-amber-950/40 text-amber-100",
  critical: "border-rose-700/70 bg-rose-950/50 text-rose-100",
};

export function MarketGapCard({ gap, territoryName }: Props) {
  return (
    <div className={`rounded-xl border p-3 ${severityStyle[gap.severity]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide opacity-80">
          {gap.gapType.replace(/_/g, " ")}
        </p>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium uppercase">
          {gap.severity}
        </span>
      </div>
      {territoryName ? (
        <p className="mt-1 text-sm font-semibold text-white">{territoryName}</p>
      ) : null}
      <p className="mt-2 text-xs leading-snug opacity-95">{gap.whyItMatters}</p>
      <p className="mt-2 border-t border-white/10 pt-2 text-xs text-sky-200/90">
        Next: {gap.recommendedNextMove}
      </p>
    </div>
  );
}
