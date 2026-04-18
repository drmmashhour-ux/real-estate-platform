import type { ExperimentOutcomeDecisionView } from "@/modules/experiments/ab-testing.types";

export function AbDecisionPanel({ decision }: { decision: ExperimentOutcomeDecisionView }) {
  return (
    <div className="rounded-lg border border-amber-900/35 bg-amber-950/20 p-3">
      <p className="text-xs font-semibold text-amber-200/90">Outcome suggestion</p>
      <p className="mt-1 text-xs text-zinc-400">
        Status: <span className="text-zinc-200">{decision.status}</span> · Confidence:{" "}
        {(decision.confidence * 100).toFixed(0)}%
      </p>
      <p className="mt-2 text-xs text-zinc-300">{decision.recommendation}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
        {decision.rationale.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
