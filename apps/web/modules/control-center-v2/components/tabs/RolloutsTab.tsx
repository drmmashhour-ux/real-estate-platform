"use client";

import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { RolloutPostureBadge } from "../shared/StatusBadge";

export function RolloutsTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const rows = data.rollouts.rows;
  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Rollout postures are derived from feature flags + subsystem health — for governance review only.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px] text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="py-2 pr-3 font-medium">System</th>
              <th className="py-2 pr-3 font-medium">Posture</th>
              <th className="py-2 pr-3 font-medium">Recommendation / note</th>
              <th className="py-2 pr-3 font-medium">Warnings</th>
              <th className="py-2 font-medium">Top blocker / note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/50">
                <td className="py-2 pr-3 font-medium text-zinc-200">{r.label}</td>
                <td className="py-2 pr-3">
                  <RolloutPostureBadge posture={r.posture} />
                </td>
                <td className="py-2 pr-3 text-zinc-400">{r.recommendation ?? "—"}</td>
                <td className="py-2 pr-3 font-mono text-zinc-400">{r.warningCount}</td>
                <td className="py-2 text-zinc-500">{r.topNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
