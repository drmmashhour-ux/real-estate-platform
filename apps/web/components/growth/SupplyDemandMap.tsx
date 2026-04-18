"use client";

/**
 * “Map” = ranked list + density cues (no geospatial API — avoids fake geo precision).
 */

export function SupplyDemandMap({
  rows,
}: {
  rows: { neighborhood: string; demandScore: number; supplyScore: number; opportunityScore: number }[];
}) {
  const sorted = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 12);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Montréal focus (top zones)</h3>
      <p className="mb-4 text-xs text-slate-500">Relative density from internal listing/booking signals — not census data.</p>
      <ul className="space-y-2">
        {sorted.map((r) => (
          <li
            key={r.neighborhood}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-slate-200">{r.neighborhood}</span>
            <span className="tabular-nums text-xs text-slate-400">
              D{r.demandScore} / S{r.supplyScore} →{" "}
              <span className="text-emerald-400">{r.opportunityScore}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
