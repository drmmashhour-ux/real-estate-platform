"use client";

import type { OpportunityLossEstimate } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function StageRevenueTable({ loss }: { loss: OpportunityLossEstimate }) {
  if (!loss.leakingStages.length) {
    return <p className="text-sm text-zinc-500">No stage-level leakage breakdown — log stage counts for sharper view.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Stage</th>
            <th className="px-3 py-2">Leak est.</th>
          </tr>
        </thead>
        <tbody>
          {loss.leakingStages.map((row) => (
            <tr key={row.stage} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 text-zinc-200">{row.stage}</td>
              <td className="px-3 py-2 text-zinc-400">{formatCentsAbbrev(row.lostCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
