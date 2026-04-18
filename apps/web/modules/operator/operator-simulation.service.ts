import type { OperatorExecutionPlan, OperatorSimulationEstimate } from "./operator-v2.types";

/**
 * Heuristic “what-if” preview for an execution plan — not a forecast, no fake precision.
 */
export function simulateExecutionPlan(plan: OperatorExecutionPlan): OperatorSimulationEstimate {
  const risks: string[] = [];
  const notes: string[] = [
    "Simulation is a coarse heuristic for review only — not a guaranteed outcome.",
  ];

  if (plan.ordered.length === 0) {
    notes.push("No actions in plan — deltas are zero.");
    return {
      label: "estimate",
      ctrDeltaApprox: 0,
      conversionDeltaApprox: 0,
      profitDeltaApprox: 0,
      risks: ["Empty execution plan."],
      notes,
    };
  }

  let ctr = 0;
  let conv = 0;
  let profit = 0;

  for (const a of plan.ordered) {
    const conf = a.confidenceScore ?? 0.5;
    const trust = a.trustScore;
    const scale = a.actionType.includes("SCALE") ? 1 : a.actionType.includes("PAUSE") ? -0.6 : 0.35;
    ctr += 0.008 * conf * trust * scale;
    conv += 0.004 * conf * trust * scale;
    profit += (a.profitImpact ?? 0.12 * conf) * 0.05 * trust;
    if (conf < 0.45) risks.push(`Low confidence on ${a.id} — wide outcome band.`);
    if (a.conflictGroup) risks.push(`Item ${a.id} was conflict-adjudicated — verify assumptions.`);
  }

  if (plan.conflicts.length > 0) {
    risks.push("Unresolved competing signals existed before resolution — review conflict log.");
  }

  const sparse = plan.ordered.filter((x) => (x.confidenceScore ?? 0) < 0.4).length;
  if (sparse >= 2) risks.push("Several low-confidence items — data may be sparse.");

  return {
    label: "estimate",
    ctrDeltaApprox: Number(ctr.toFixed(4)),
    conversionDeltaApprox: Number(conv.toFixed(4)),
    profitDeltaApprox: Number(profit.toFixed(4)),
    risks: [...new Set(risks)],
    notes,
  };
}
