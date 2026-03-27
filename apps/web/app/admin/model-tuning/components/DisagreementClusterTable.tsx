"use client";

import type { ClusterAnalysis } from "@/modules/model-tuning/domain/tuning.types";

export function DisagreementClusterTable({ clusters }: { clusters: ClusterAnalysis[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-500">
          <tr>
            <th className="px-3 py-2">Cluster</th>
            <th className="px-3 py-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {clusters.map((c) => (
            <tr key={c.cluster} className="border-b border-zinc-800/70">
              <td className="px-3 py-2 font-mono text-zinc-300">{c.cluster}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-200">{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
