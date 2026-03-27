"use client";

import { TrendConfidenceBadge } from "./TrendConfidenceBadge";

export type MarketTrendCardProps = {
  direction: string;
  confidence: string;
  safeSummary: string;
  warnings: string[];
};

export function MarketTrendCard({ direction, confidence, safeSummary, warnings }: MarketTrendCardProps) {
  const dirLabel =
    direction === "upward_pressure"
      ? "Upward pressure"
      : direction === "downward_pressure"
        ? "Downward pressure"
        : direction === "neutral"
          ? "Neutral"
          : "Insufficient / uncertain";

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Market trend signal</span>
        <TrendConfidenceBadge level={confidence} />
      </div>
      <p className="mt-2 text-sm font-medium text-emerald-200/90">{dirLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{safeSummary}</p>
      {warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-xs text-slate-500">
        Not an appraisal. Does not guarantee future prices or returns. Use alongside your own diligence.
      </p>
    </div>
  );
}
