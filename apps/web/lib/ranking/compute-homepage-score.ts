/**
 * Marketing homepage featured stays: quality, trust, conversion signals, freshness, plus exploration inside the 8 factors.
 */

import type { ListingSearchMetrics } from "@prisma/client";
import type { BnhubListingRankingInput, RankingSignalBundle } from "@/src/modules/ranking/types";
import {
  computeRankScore,
  DEFAULT_UNIFIED_RANK_WEIGHTS,
  mapSignalsToRankComponents,
  mergeRankWeights,
  type RankScoreComponents,
} from "./compute-rank-score";
import { computeExplorationScore } from "./exploration";

/** Favor quality, trust, performance (conversion), freshness; keep relevance moderate. */
export const HOMEPAGE_FEATURED_UNIFIED_WEIGHTS = mergeRankWeights(DEFAULT_UNIFIED_RANK_WEIGHTS, {
  relevance_score: 0.12,
  quality_score: 0.22,
  trust_score: 0.2,
  performance_score: 0.22,
  price_score: 0.06,
  freshness_score: 0.1,
  availability_score: 0.03,
  exploration_score: 0.05,
});

export function computeHomepageFeaturedScore(
  signals: RankingSignalBundle,
  input: BnhubListingRankingInput,
  metrics: ListingSearchMetrics | null
): { score0to100: number; components: RankScoreComponents } {
  const exploration01 = computeExplorationScore({
    createdAt: input.createdAt,
    views30d: metrics?.views30d ?? 0,
    qualityScore: signals.quality,
    medianViewsHint: 24,
  });
  const components = mapSignalsToRankComponents(signals, exploration01);
  return {
    score0to100: computeRankScore(components, HOMEPAGE_FEATURED_UNIFIED_WEIGHTS),
    components,
  };
}

export function homepageLocationBucket(input: BnhubListingRankingInput): string {
  const city = (input.city ?? "").trim().toLowerCase() || "unknown";
  const r = (input.region ?? "").trim().toLowerCase() || "";
  return `${city}|${r}`;
}

export function homepagePropertyBucket(input: BnhubListingRankingInput): string {
  return (input.propertyType ?? input.roomType ?? "other").trim().toLowerCase() || "other";
}
