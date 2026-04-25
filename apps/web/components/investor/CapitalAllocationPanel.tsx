"use client";

import type { CapitalAllocationView } from "@/modules/investor-intelligence/investor-intelligence.types";

type Props = { recs: CapitalAllocationView[]; className?: string };

export function CapitalAllocationPanel({ recs, className }: Props) {
  return (
    <div className={className} data-testid="capital-allocation">
      <h3 className="text-sm font-medium text-slate-800">Capital allocation (advisory)</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {recs.map((r) => (
          <li key={r.recommendationKey} className="rounded-lg border border-slate-200 bg-amber-50/40 p-3">
            <p className="text-xs text-slate-500">
              {r.scopeType} / {r.scopeKey.slice(0, 64)} — {r.recommendationType} — confidence {r.confidence}
            </p>
            <p className="mt-1">{r.rationale[0]}</p>
            <p className="text-xs text-slate-500">{r.expectedImpact.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
