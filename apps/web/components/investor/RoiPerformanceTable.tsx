"use client";

import type { RoiInsight } from "@/modules/investor-intelligence/investor-intelligence.types";

type Props = { rows: RoiInsight[]; className?: string };

export function RoiPerformanceTable({ rows, className }: Props) {
  return (
    <div className={className} data-testid="roi-table">
      <h3 className="text-sm font-medium text-slate-800">ROI & efficiency (by scope)</h3>
      <p className="text-xs text-slate-500">Not additive as total P&amp;L; read trace column intent.</p>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200 text-xs">
        <table className="w-full min-w-[36rem] text-left">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="p-2">Scope</th>
              <th className="p-2">Revenue</th>
              <th className="p-2">W/L</th>
              <th className="p-2">Eff.</th>
              <th className="p-2">ROI~</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r) => (
              <tr key={r.scopeType + r.scopeKey} className="border-t border-slate-100">
                <td className="p-2">
                  {r.scopeType} · <span className="text-slate-400">{r.scopeKey.slice(0, 32)}</span>
                </td>
                <td className="p-2 tabular-nums">{r.revenue.toFixed(0)}</td>
                <td className="p-2 tabular-nums">
                  {r.wonDeals}/{r.lostDeals}
                </td>
                <td className="p-2 tabular-nums">{r.efficiencyScore == null ? "—" : r.efficiencyScore.toFixed(2)}</td>
                <td className="p-2 tabular-nums">{r.roiScore == null ? "—" : r.roiScore.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
