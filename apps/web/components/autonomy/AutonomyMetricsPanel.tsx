"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type MetricsRow = {
  uiDomainId: string;
  title: string;
  actionsExecuted: number;
  successRate: number | null;
  failureRate: number | null;
  approvalRatio: number | null;
  roiImpactBand: string;
  timeSavedMinutes: number;
};

export function AutonomyMetricsPanel(props: { rows: MetricsRow[] }) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 10</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Autonomy performance metrics</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>
          Per-domain rollups (7d window) — time saved uses operator heuristics from full autopilot telemetry.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b border-[#D4AF37]/15 text-[11px] uppercase tracking-wide ${autonomyMuted}`}>
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Actions</th>
              <th className="py-2 pr-2">Success</th>
              <th className="py-2 pr-2">Failure</th>
              <th className="py-2 pr-2">Approval ratio</th>
              <th className="py-2 pr-2">ROI band</th>
              <th className="py-2">Est. minutes saved</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.uiDomainId} className="border-b border-[#D4AF37]/10">
                <td className="py-2 pr-2 text-[#f4efe4]">{r.title}</td>
                <td className="py-2 pr-2 text-[#e8dfd0]">{r.actionsExecuted}</td>
                <td className="py-2 pr-2 text-[#e8dfd0]">
                  {r.successRate == null ? "—" : `${(r.successRate * 100).toFixed(1)}%`}
                </td>
                <td className="py-2 pr-2 text-[#e8dfd0]">
                  {r.failureRate == null ? "—" : `${(r.failureRate * 100).toFixed(1)}%`}
                </td>
                <td className="py-2 pr-2 text-[#e8dfd0]">
                  {r.approvalRatio == null ? "—" : `${(r.approvalRatio * 100).toFixed(0)}%`}
                </td>
                <td className="py-2 pr-2 text-[#c9b667]">{r.roiImpactBand}</td>
                <td className="py-2 text-[#e8dfd0]">{r.timeSavedMinutes.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
