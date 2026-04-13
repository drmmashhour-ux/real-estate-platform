"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

export type BnhubKpiStatProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** vs prior period, e.g. +12.4 */
  growthPercent?: number | null;
  growthLabel?: string;
};

export function BnhubKpiStat({
  title,
  value,
  hint,
  icon: Icon,
  growthPercent,
  growthLabel = "vs prior month",
}: BnhubKpiStatProps) {
  const showGrowth = growthPercent != null && Number.isFinite(growthPercent);
  const positive = (growthPercent ?? 0) >= 0;
  const GrowthIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="bnhub-card bnhub-card--elevated flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="bnhub-kpi-title">{title}</p>
          <p className="bnhub-kpi-value mt-2">{value}</p>
          {hint ? <p className="bnhub-kpi-hint mt-2">{hint}</p> : null}
          {showGrowth ? (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                positive ? "text-emerald-400/95" : "text-rose-400/95"
              }`}
            >
              <GrowthIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {positive ? "+" : ""}
                {growthPercent!.toFixed(1)}%
              </span>
              <span className="font-normal text-bnhub-text-muted">· {growthLabel}</span>
            </p>
          ) : null}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-bnhub-border bg-bnhub-main"
          aria-hidden
        >
          <Icon className="h-5 w-5 text-bnhub-gold" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
