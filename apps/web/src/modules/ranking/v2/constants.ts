import type { RankingDomain } from "./ranking.types";

/** Weights for v2 — all signals normalized 0..1 before blend; output 0..100. */
export const RANKING_V2_WEIGHTS: Record<
  RankingDomain,
  Record<
    | "relevance"
    | "recency"
    | "trust"
    | "quality"
    | "priceCompetitiveness"
    | "engagement"
    | "conversion"
    | "liquidity"
    | "featuredBoost",
    number
  >
> = {
  listings: {
    relevance: 0.22,
    recency: 0.08,
    trust: 0.16,
    quality: 0.14,
    priceCompetitiveness: 0.1,
    engagement: 0.1,
    conversion: 0.1,
    liquidity: 0.06,
    featuredBoost: 0.04,
  },
  bnhub: {
    relevance: 0.24,
    recency: 0.07,
    trust: 0.14,
    quality: 0.1,
    priceCompetitiveness: 0.06,
    engagement: 0.1,
    conversion: 0.12,
    liquidity: 0.09,
    featuredBoost: 0.08,
  },
  investor_collections: {
    relevance: 0.2,
    recency: 0.06,
    trust: 0.18,
    quality: 0.12,
    priceCompetitiveness: 0.14,
    engagement: 0.08,
    conversion: 0.1,
    liquidity: 0.08,
    featuredBoost: 0.04,
  },
};

/** When trust (0..1) or quality (0..1) below these, featured boost is forced to 0. */
export const RANKING_V2_TRUST_FLOOR = 0.35;
export const RANKING_V2_QUALITY_FLOOR = 0.28;

/** Max contribution from featured channel after weighting (prevents pay-to-win). */
export const RANKING_V2_FEATURED_CAP = 8;
