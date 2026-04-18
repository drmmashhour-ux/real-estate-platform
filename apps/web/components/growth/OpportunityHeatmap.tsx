"use client";

import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

type Row = MontrealOpportunityRow & { priority?: string };

function heat(score: number): string {
  if (score >= 70) return "bg-emerald-500/30 text-emerald-200 border-emerald-600/50";
  if (score >= 45) return "bg-amber-500/20 text-amber-100 border-amber-600/40";
  return "bg-slate-700/50 text-slate-300 border-slate-600/40";
}

export function OpportunityHeatmap({
  opportunities,
  title = "Neighborhood opportunities",
}: {
  opportunities: Row[];
  title?: string;
}) {
  if (!opportunities.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">
        No opportunity rows in this snapshot.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500">Scores are model outputs from platform data — not external market claims.</p>
      </div>
      <div className="max-h-[min(420px,50vh)] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Zone</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Price band</th>
              <th className="px-4 py-2 text-right">Demand</th>
              <th className="px-4 py-2 text-right">Supply</th>
              <th className="px-4 py-2 text-right">Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o, i) => (
              <tr key={`${o.neighborhood}-${o.propertyType}-${o.priceBand}-${i}`} className="border-b border-slate-800/60">
                <td className="px-4 py-2 font-medium text-slate-200">{o.neighborhood}</td>
                <td className="px-4 py-2 text-slate-400">{o.propertyType ?? "—"}</td>
                <td className="px-4 py-2 text-slate-400">{o.priceBand}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{o.demandScore}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{o.supplyScore}</td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={`inline-block min-w-[3rem] rounded border px-2 py-0.5 text-center tabular-nums text-xs font-medium ${heat(o.opportunityScore)}`}
                  >
                    {o.opportunityScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
