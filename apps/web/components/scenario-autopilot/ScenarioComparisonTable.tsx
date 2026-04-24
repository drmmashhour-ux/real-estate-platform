import type { EnrichedCandidate } from "@/modules/scenario-autopilot/scenario-autopilot.types";

export function ScenarioComparisonTable(props: { candidates: EnrichedCandidate[]; bestId?: string | null }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e1e1e]">
      <table className="min-w-full text-left text-sm text-neutral-300">
        <thead className="bg-[#0f0f0f] text-[10px] uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Upside (rev %)</th>
            <th className="px-3 py-2">Risk (disp.)</th>
            <th className="px-3 py-2">Conf.</th>
            <th className="px-3 py-2">Effort</th>
            <th className="px-3 py-2">Reversible</th>
          </tr>
        </thead>
        <tbody>
          {props.candidates.map((c) => (
            <tr
              key={c.id}
              className={c.id === props.bestId ? "bg-[#D4AF37]/5" : "border-t border-[#1a1a1a]"}
            >
              <td className="px-3 py-2 text-[#f0ebe0]">
                {c.title}
                {c.id === props.bestId ? <span className="ml-2 text-[10px] text-[#D4AF37]">best</span> : null}
              </td>
              <td className="px-3 py-2">{c.normalized.revenueDelta.toFixed(1)}%</td>
              <td className="px-3 py-2">{c.normalized.disputeRiskDelta.toFixed(1)}</td>
              <td className="px-3 py-2">{c.simulation.confidenceLevel}</td>
              <td className="px-3 py-2">{c.effortScore.toFixed(2)}</td>
              <td className="px-3 py-2">{c.reversible ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
