"use client";

import type { StrategicRecommendation } from "../market-domination.types";

type Props = { rec: StrategicRecommendation; territoryName: string };

const impactCls = {
  low: "text-zinc-400",
  medium: "text-amber-200",
  high: "text-emerald-300",
};

export function MarketRecommendationCard({ rec, territoryName }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{territoryName}</p>
          <p className="font-semibold text-white">{rec.action}</p>
        </div>
        <div className="text-right text-[11px]">
          <p className="text-zinc-500">Hub</p>
          <p className="font-mono text-violet-200">{rec.targetHub}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        <span className={impactCls[rec.expectedImpact]}>
          Impact: <strong>{rec.expectedImpact}</strong>
        </span>
        <span className="text-zinc-400">
          Urgency: <strong className="text-zinc-200">{rec.urgency}</strong>
        </span>
        <span className="text-zinc-500">
          Confidence: <strong className="text-zinc-300">{(rec.confidence * 100).toFixed(0)}%</strong>
        </span>
      </div>
      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-zinc-400">{rec.explanation}</p>
    </div>
  );
}
