import type { NegotiationScenario } from "@/modules/negotiation-simulator/negotiation-simulator.types";

const shortOut: Record<NegotiationScenario["expectedOutcome"], string> = {
  positive_progress: "↑",
  neutral_progress: "○",
  stall_risk: "⏸",
  pushback_risk: "⚑",
};

type Props = { scenarios: NegotiationScenario[] };

export function ApproachComparisonTable({ scenarios }: Props) {
  if (scenarios.length === 0) return null;
  return (
    <div className="overflow-x-auto text-xs text-slate-300">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-left text-slate-500">
            <th className="py-1 pr-2">Approach</th>
            <th className="py-1 pr-2">Scenario lean</th>
            <th className="py-1 pr-2">Cap</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.approachKey} className="border-b border-slate-800/60">
              <td className="py-1.5 pr-2 font-mono text-[11px] text-amber-200/90">{s.approachKey}</td>
              <td className="py-1.5 pr-2">
                {shortOut[s.expectedOutcome]} {s.expectedOutcome.replace(/_/g, " ")}
              </td>
              <td className="py-1.5 pr-2 text-slate-500">{s.confidence.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
