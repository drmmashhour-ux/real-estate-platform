/**
 * Learning aggregator — session-level heuristics; does not overwrite Brain/Operator stored outcomes.
 */
import type { LearningAggregatorSnapshot } from "./autonomous-company.types";

export function aggregateLearningSnapshot(input: {
  decisionsCount: number;
  opportunitiesCount: number;
  plannedActions: number;
}): LearningAggregatorSnapshot {
  const denom = Math.max(1, input.decisionsCount);
  const accuracyApprox = Math.min(1, input.opportunitiesCount / (denom * 2 + 1));
  return {
    successRateApprox: null,
    roiApprox: null,
    accuracyApprox,
    failurePatterns: [],
    notes: [
      `Heuristic coverage: ${input.opportunitiesCount} opportunities vs ${input.decisionsCount} decisions; ${input.plannedActions} plan rows — use Brain/Operator pipelines for ground-truth outcomes.`,
    ],
  };
}
