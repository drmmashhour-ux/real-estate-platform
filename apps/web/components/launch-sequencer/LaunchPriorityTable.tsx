import type { LaunchSequenceRecommendation } from "@/modules/launch-sequencer/launch-sequencer.types";
import { LaunchModeBadge } from "./LaunchModeBadge";

export function LaunchPriorityTable(props: { recommendations: LaunchSequenceRecommendation[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-neutral-200">
        <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-2">Rank</th>
            <th className="px-3 py-2">Market</th>
            <th className="px-3 py-2">Readiness</th>
            <th className="px-3 py-2">Mode</th>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">Blockers</th>
          </tr>
        </thead>
        <tbody>
          {props.recommendations.map((r) => {
            const blockers = r.dependencies.filter((d) => d.blocking).length;
            return (
              <tr key={r.marketKey} className="border-b border-white/5">
                <td className="px-3 py-2 font-mono text-neutral-400">{r.priorityRank}</td>
                <td className="px-3 py-2 font-medium text-[#D4AF37]/90">{r.marketKey}</td>
                <td className="px-3 py-2">
                  {r.readiness.score}{" "}
                  <span className="text-xs text-neutral-500">({r.readiness.label})</span>
                </td>
                <td className="px-3 py-2">
                  <LaunchModeBadge mode={r.launchMode} />
                </td>
                <td className="px-3 py-2 text-xs">{r.riskProfile.overallRisk}</td>
                <td className="px-3 py-2 text-xs text-neutral-400">{blockers}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
