/**
 * Explicit risks, assumptions, and uncertainty for every scenario.
 */

import type {
  SimulationActionInput,
  SimulationBaseline,
  SimulationEffectEstimate,
} from "@/modules/growth/action-simulation.types";

export function buildRisksAndAssumptions(
  input: SimulationActionInput,
  baseline: SimulationBaseline,
  effects: SimulationEffectEstimate[],
): { risks: string[]; assumptions: string[]; uncertainty: string[] } {
  const risks: string[] = [];
  const assumptions: string[] = [];
  const uncertainty: string[] = [];

  assumptions.push("Operator behavior and channel mix stay within the same order of magnitude as the last window.");
  assumptions.push("No material product or policy change outside the stated action is applied in parallel.");
  if (input.rationale) {
    assumptions.push(`Operator-stated intent: ${input.rationale.slice(0, 400)}`);
  }

  if (baseline.confidence === "low") {
    uncertainty.push("Sparse CRM / growth signals — wide error bars on any direction.");
  }
  if (baseline.warnings.length > 0) {
    uncertainty.push(`Telemetry caveats: ${baseline.warnings.slice(0, 2).join(" · ")}`.slice(0, 500));
  }

  if (input.intensity === "high" && baseline.leads < 20) {
    risks.push("High execution intensity on a small lead base can over-rotate on noise — pair with capacity review.");
  }

  if (input.targetCity) {
    risks.push("City labels in CRM are not always normalized; double-check spellings and market definitions before spend.");
  }
  if (input.targetBrokerId) {
    risks.push("Routing or broker-scoped actions require current capacity and compliance — id is a planning hint only.");
  }

  const downish = effects.filter((e) => e.predictedDirection === "down" || e.predictedDirection === "uncertain").length;
  if (downish > 0) {
    risks.push("At least one modeled vector is flat/negative/uncertain — do not treat the plan as all-upside.");
  }

  if (input.category === "routing_shift") {
    risks.push("Skewing to elite brokers can create queueing and perceived unfairness if total capacity is fixed.");
  }
  if (input.category === "demand_generation") {
    risks.push("Volume without win-rate focus can increase handoff cost and false positives in routing.");
  }
  if (input.category === "city_domination" && !input.targetCity) {
    risks.push("City domination without a named market is not operable — model confidence is forced low.");
  }

  return {
    risks: risks.slice(0, 8),
    assumptions: assumptions.slice(0, 6),
    uncertainty: uncertainty.slice(0, 5),
  };
}
