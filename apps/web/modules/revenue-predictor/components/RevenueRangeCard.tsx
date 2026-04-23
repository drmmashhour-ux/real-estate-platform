"use client";

import type { ForecastRangeCents } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function RevenueRangeCard({
  title,
  ranges,
  subtitle,
}: {
  title: string;
  ranges: ForecastRangeCents;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="text-zinc-400">
          Low: <strong className="text-zinc-200">{formatCentsAbbrev(ranges.conservativeCents)}</strong>
        </span>
        <span className="text-zinc-400">
          Base: <strong className="text-amber-200">{formatCentsAbbrev(ranges.baseCents)}</strong>
        </span>
        <span className="text-zinc-400">
          High: <strong className="text-emerald-200">{formatCentsAbbrev(ranges.upsideCents)}</strong>
        </span>
      </div>
    </div>
  );
}
