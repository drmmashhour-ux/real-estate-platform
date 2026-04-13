/**
 * Ranking Engine v1 — centralized weights (must match `SIGNAL_KEYS` in scoringEngine).
 * Signals are normalized to 0–1 before blending; final `totalScore` is 0–100.
 *
 * TODO v2: personalization weights per user segment; multi-objective Pareto blends.
 */
export const RANKING_V1_SIGNAL_WEIGHTS = {
  relevance: 0.24,
  trust: 0.16,
  quality: 0.14,
  engagement: 0.12,
  conversion: 0.14,
  freshness: 0.08,
  host: 0.02,
  review: 0.02,
  priceCompetitiveness: 0.06,
  availability: 0.02,
} as const;

/** Minimum FSBO peers required before price competitiveness uses market comparison (not neutral). */
export const PRICE_COMPETITIVENESS_MIN_PEER_COUNT = 5;

/** FSBO catalog: treat as "top listing" only at or above this total score (0–100). */
export const TOP_LISTING_PUBLIC_SCORE_THRESHOLD = 82;
