/**
 * Effectiveness scoring from observed aggregates only — sparse data explicitly marked.
 */

import type {
  GrowthAutonomyCategoryAggregate,
  GrowthAutonomyEffectivenessScore,
  GrowthAutonomyEffectivenessScoreBand,
  GrowthAutonomyRecommendationCategory,
} from "./growth-autonomy-learning.types";
import { getGrowthAutonomyLearningGuardrails } from "./growth-autonomy-learning-config";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function computeEffectivenessForCategory(args: {
  category: GrowthAutonomyRecommendationCategory;
  aggregate: GrowthAutonomyCategoryAggregate;
}): GrowthAutonomyEffectivenessScore {
  const g = getGrowthAutonomyLearningGuardrails();
  const a = args.aggregate;
  const shown = a.shown;
  const observationCount = shown;
  if (observationCount < g.minObservationsBeforeLearning) {
    return {
      category: args.category,
      band: "insufficient_data",
      observationCount,
    };
  }

  const interactionRate = (a.interacted + a.prefillUsed) / Math.max(1, shown);
  const completionRate = a.completed / Math.max(1, shown);
  const feedbackDenom = a.helpfulYes + a.helpfulNo;
  const positiveFeedbackRate = feedbackDenom > 0 ? a.helpfulYes / feedbackDenom : undefined;
  const negativeFeedbackRate = feedbackDenom > 0 ? a.helpfulNo / feedbackDenom : undefined;
  const confusionRate = a.confusion / Math.max(1, shown);

  let numeric =
    0.42 +
    0.22 * interactionRate +
    0.18 * completionRate -
    0.14 * (negativeFeedbackRate ?? 0) -
    0.12 * confusionRate;
  if (positiveFeedbackRate !== undefined) numeric += 0.12 * positiveFeedbackRate;
  numeric = clamp01(numeric);

  let band: GrowthAutonomyEffectivenessScoreBand = "weak";
  if (numeric >= 0.72) band = "strong";
  else if (numeric >= 0.58) band = "good";
  else if (numeric >= 0.45) band = "weak";
  else band = "poor";

  return {
    category: args.category,
    band,
    numericScore: numeric,
    interactionRate,
    completionRate,
    positiveFeedbackRate,
    negativeFeedbackRate,
    confusionRate,
    observationCount,
  };
}
