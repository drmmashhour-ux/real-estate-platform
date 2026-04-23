"use client";

import type { CoachingUpliftForecast } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function CoachingUpliftCard({ uplift }: { uplift: CoachingUpliftForecast }) {
  return (
    <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-sm">
      <p className="font-medium text-emerald-200">Coaching uplift band</p>
      <p className="mt-2 text-lg font-semibold text-emerald-100">{formatCentsAbbrev(uplift.potentialUpliftCents)} potential</p>
      <p className="mt-1 text-xs text-zinc-500">
        Band ~{Math.round(uplift.upliftLowPct * 100)}–{Math.round(uplift.upliftHighPct * 100)}% · confidence {uplift.confidenceLabel}
      </p>
      <p className="mt-3 text-zinc-400">{uplift.narrative}</p>
    </div>
  );
}
