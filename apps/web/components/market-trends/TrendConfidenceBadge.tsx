"use client";

import type { TrendConfidenceLevel } from "@/modules/market-trends/domain/trendTypes";

const CONF_STYLES: Record<TrendConfidenceLevel, string> = {
  insufficient_data: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  low: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  medium: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  high: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
};

export function TrendConfidenceBadge({ level }: { level: string }) {
  const key = (["insufficient_data", "low", "medium", "high"] as const).includes(level as TrendConfidenceLevel)
    ? (level as TrendConfidenceLevel)
    : "insufficient_data";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${CONF_STYLES[key]}`}>
      Confidence: {key.replace(/_/g, " ")}
    </span>
  );
}
