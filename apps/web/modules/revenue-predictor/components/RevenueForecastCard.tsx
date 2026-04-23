"use client";

import type { SalespersonRevenueForecast } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function RevenueForecastCard({ forecast }: { forecast: SalespersonRevenueForecast }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{forecast.forecastPeriodLabel}</p>
      <p className="mt-1 text-sm text-zinc-400">
        Blended close probability ~{(forecast.weightedCloseProbability * 100).toFixed(1)}% (model blend — not a promise).
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">Conservative</dt>
          <dd className="font-semibold text-zinc-100">{formatCentsAbbrev(forecast.ranges.conservativeCents)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Base</dt>
          <dd className="font-semibold text-amber-300">{formatCentsAbbrev(forecast.ranges.baseCents)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Upside</dt>
          <dd className="font-semibold text-emerald-300">{formatCentsAbbrev(forecast.ranges.upsideCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
