/**
 * Centralized weights & guardrails for BNHub ranking + advisory dynamic pricing.
 * Tune here — avoid scattering magic numbers across services.
 */

export const BNHUB_RANKING_WEIGHTS = {
  conversionQuality: 0.28,
  listingQuality: 0.22,
  freshness: 0.12,
  priceCompetitiveness: 0.18,
  trustCompleteness: 0.15,
  /** Sum of explicit weights; remainder reserved for featured boost cap */
  featuredBoostCap: 0.08,
} as const;

/** Minimum aggregate conversion-related events to treat conversion as reliable. */
export const BNHUB_RANKING_COLD_START_EVENT_THRESHOLD = 24;

/** When below threshold, multiply conversion sub-score by this factor (cold-start). Softer = less punishment for no history. */
export const BNHUB_RANKING_COLD_START_CONVERSION_DAMPING = 0.48;

/**
 * Recent listings with little traffic: small additive boost so discovery is not dominated by zero conversion alone.
 * Capped; decays with age. BNHub-only tuning.
 */
export const BNHUB_RANKING_NEW_LISTING_MAX_BOOST = 5;
export const BNHUB_RANKING_NEW_LISTING_BOOST_MAX_AGE_DAYS = 45;

/** Small capped boost when listing is in active promoted set (applied in integration layer). */
export const BNHUB_RANKING_FEATURED_BOOST_MAX = 6;

export const BNHUB_PRICING_GUARDRAILS = {
  maxIncreasePct: 0.12,
  maxDecreasePct: 0.15,
  minTrafficEventsForStrongSuggestion: 40,
  /** Max move vs current when peer sample or traffic is thin — recommendation-only, no auto-apply. */
  lowConfidenceMaxAbsMovePct: 0.05,
  /** Minimum published peers in city before using local median for narrative or price pressure. */
  minPeerSampleForMedianNarrative: 4,
} as const;
