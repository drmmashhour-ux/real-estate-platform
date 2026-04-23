"use client";

import type { OpportunityLossEstimate } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function OpportunityLossCard({ loss }: { loss: OpportunityLossEstimate }) {
  return (
    <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-sm">
      <p className="font-medium text-rose-200">Estimated leakage (heuristic)</p>
      <p className="mt-2 text-2xl font-semibold text-rose-100">{formatCentsAbbrev(loss.estimatedLostRevenueCents)}</p>
      <ul className="mt-3 space-y-1 text-zinc-400">
        {loss.topLossDrivers.map((d) => (
          <li key={d.label}>
            {d.label}: {formatCentsAbbrev(d.impactCents)}
          </li>
        ))}
      </ul>
      <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
        {loss.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
