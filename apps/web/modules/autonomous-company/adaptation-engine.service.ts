/**
 * Adaptation — bounded proposals only (no automatic weight writes).
 */
import type { AdaptationEngineSuggestion, LearningAggregatorSnapshot } from "./autonomous-company.types";

const MAX_DELTA = 0.03;

export function suggestBoundedAdaptation(learning: LearningAggregatorSnapshot | null): AdaptationEngineSuggestion {
  const notes = [
    "Gradual adaptation only — any production weight change requires product review and reversible rollout.",
  ];
  if (!learning || learning.accuracyApprox === null) {
    return {
      weightDeltasSuggested: [],
      thresholdDeltasSuggested: [],
      reversible: true,
      notes,
    };
  }

  const w = learning.accuracyApprox < 0.4 ? MAX_DELTA : MAX_DELTA * 0.5;
  return {
    weightDeltasSuggested: [{ key: "fusion_agreement_sensitivity", delta: w, bound: MAX_DELTA }],
    thresholdDeltasSuggested: [{ key: "opportunity_urgency_floor", delta: -w * 0.5, bound: MAX_DELTA }],
    reversible: true,
    notes,
  };
}
