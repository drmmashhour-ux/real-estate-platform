/**
 * Deterministic ranking rules for growth auto-suggestions — advisory only.
 * Scores are heuristics over weak signals; higher rank ≠ proven effectiveness.
 */

import type {
  MarketplaceFlywheelInsight,
  MarketplaceFlywheelInsightType,
} from "@/modules/marketplace/flywheel.types";
import type { GrowthActionSuccessProfile } from "@/modules/growth/flywheel-success-suggestions.types";
import type { InsightLearningHint } from "@/modules/growth/flywheel-learning.service";
import { defaultActionTypeForInsight } from "@/modules/growth/flywheel-action.service";

export type RankableSuggestionSeed = {
  actionType: string;
  relatedInsightType: MarketplaceFlywheelInsightType | null;
  insight?: MarketplaceFlywheelInsight;
  profile?: GrowthActionSuccessProfile;
  insightLearning?: InsightLearningHint;
  /** Higher sorts first */
  priorityScore: number;
};

export function computeRankScore(seed: RankableSuggestionSeed): number {
  const { profile, insight, insightLearning } = seed;
  let score = seed.priorityScore * 1000;

  const sr = profile?.successRate ?? null;
  const conf = profile?.confidenceLevel ?? "low";
  const il = insightLearning?.confidence ?? "low";

  if (sr != null) score += sr * 400;
  if (conf === "high") score += 80;
  else if (conf === "medium") score += 40;

  if (insight?.impact === "high") score += 60;
  else if (insight?.impact === "medium") score += 30;

  const negShare =
    profile && profile.positiveCount + profile.neutralCount + profile.negativeCount > 0
      ? profile.negativeCount /
        Math.max(1, profile.positiveCount + profile.neutralCount + profile.negativeCount)
      : 0;
  score -= negShare * 200;

  if (il === "low") score -= 50;

  return score;
}

export function insightToDefaultActionType(insightType: MarketplaceFlywheelInsightType): string {
  return defaultActionTypeForInsight(insightType);
}
