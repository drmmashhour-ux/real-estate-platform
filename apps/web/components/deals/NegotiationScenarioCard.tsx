import type { NegotiationScenario } from "@/modules/negotiation-simulator/negotiation-simulator.types";

const outLabel: Record<NegotiationScenario["expectedOutcome"], string> = {
  positive_progress: "Progress lean",
  neutral_progress: "Neutral / mixed",
  stall_risk: "Stall / drift risk",
  pushback_risk: "Pushback / friction risk",
};

type Props = { s: NegotiationScenario };

export function NegotiationScenarioCard({ s }: Props) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
      <p className="font-medium text-slate-200">{s.approachKey.replace(/_/g, " ")}</p>
      <p className="mt-1 text-xs text-amber-200/90">
        {outLabel[s.expectedOutcome]} · confidence cap {s.confidence.toFixed(2)} (heuristic, not a guarantee)
      </p>
      {s.rationale.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {s.rationale.map((t) => (
            <li key={t.slice(0, 50)}>{t}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-slate-400">Likely next step: {s.likelyNextStep}</p>
      {s.likelyObjectionPath.length > 0 ? (
        <p className="mt-1 text-xs text-slate-500">Possible concerns: {s.likelyObjectionPath.join(" · ")}</p>
      ) : null}
    </div>
  );
}
