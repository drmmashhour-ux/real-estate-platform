/**
 * Plain-language explanations for learning decisions — deterministic from inputs.
 */

import type {
  GrowthAutonomyEffectivenessScore,
  GrowthAutonomyLearningDecision,
} from "./growth-autonomy-learning.types";

export function explainLearningDecision(args: {
  categoryLabel: string;
  decision: GrowthAutonomyLearningDecision;
  effectiveness: GrowthAutonomyEffectivenessScore;
}): string {
  const { decision, effectiveness, categoryLabel } = args;
  if (effectiveness.band === "insufficient_data") {
    return `${categoryLabel}: insufficient observations (${effectiveness.observationCount}) to adjust priority — holding neutral.`;
  }

  switch (decision) {
    case "increase_priority":
      return `${categoryLabel}: interaction and follow-through signals are positive relative to peers — applying a small bounded priority increase.`;
    case "decrease_priority":
      return `${categoryLabel}: weak engagement or negative feedback versus observations — applying a small bounded priority decrease.`;
    case "suppress_temporarily":
      return `${categoryLabel}: repeated low engagement or negative signals — temporarily reducing visibility (reversible; not a policy block).`;
    case "manual_review_queue":
      return `${categoryLabel}: mixed or conflicting signals — flagged for operator review before stronger adjustments.`;
    default:
      return `${categoryLabel}: signals are near baseline — no priority change this cycle.`;
  }
}
