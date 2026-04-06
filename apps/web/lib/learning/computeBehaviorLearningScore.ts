import type { ListingLearningStats } from "@prisma/client";
import { LEARNING_RANK_BLEND, NEUTRAL_BEHAVIOR_SCORE } from "@/lib/learning/behavior-weights";
import { computeListingContextMatch, contextMatchBoost01, preferenceVectorFromProfile } from "@/lib/learning/contextPreference";
import type { BehaviorPreferenceProfile } from "@prisma/client";
import type { ListingLearningFeatures } from "@/lib/learning/types";
import { computeRecentTrendScoreFromStats } from "@/lib/learning/recentTrend";

export type BehaviorLearningComputeInput = {
  baseRankingScore: number;
  /** 0–1 */
  features: ListingLearningFeatures;
  stats: ListingLearningStats | null;
  profile: BehaviorPreferenceProfile | null;
  searchCity?: string | null;
};

/**
 * Combine base rank + cached behavior + context + trend into a single 0–1 score.
 */
export function computeBehaviorLearningScore(input: BehaviorLearningComputeInput): number {
  const { baseRankingScore, features, stats, profile, searchCity } = input;
  const b = Math.min(1, Math.max(0, baseRankingScore));

  const behaviorRaw = stats?.behaviorScore ?? NEUTRAL_BEHAVIOR_SCORE;
  const behavior = Number.isFinite(behaviorRaw) ? Math.min(1, Math.max(0, behaviorRaw)) : NEUTRAL_BEHAVIOR_SCORE;

  const prefs = preferenceVectorFromProfile(profile);
  const match = computeListingContextMatch(features, prefs, searchCity);
  const contextBoost = contextMatchBoost01(match);
  const contextScore = Math.min(1, Math.max(0, 0.5 + contextBoost));

  const trend = computeRecentTrendScoreFromStats(stats);

  const out =
    b * LEARNING_RANK_BLEND.baseRanking +
    behavior * LEARNING_RANK_BLEND.behavior +
    contextScore * LEARNING_RANK_BLEND.contextMatch +
    trend * LEARNING_RANK_BLEND.recentTrend;

  return Math.min(1, Math.max(0, out));
}
