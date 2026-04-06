import type { BehaviorEventType } from "@prisma/client";

/**
 * Central configurable weights for behavior learning targets.
 * Positive = good outcome; negative = weak / bounce signals.
 */
export const BEHAVIOR_EVENT_WEIGHTS: Record<BehaviorEventType, number> = {
  LISTING_IMPRESSION: 0,
  LISTING_CLICK: 1,
  LISTING_SAVE: 2,
  LISTING_SHARE: 2,
  LISTING_CONTACT_CLICK: 4,
  LISTING_UNLOCK_START: 1,
  LISTING_UNLOCK_SUCCESS: 6,
  LISTING_BOOKING_ATTEMPT: 8,
  LISTING_BOOKING_SUCCESS: 10,
  SEARCH_FILTERS_APPLIED: 0.25,
  MAP_PIN_CLICK: 1.25,
  SIMILAR_LISTING_CLICK: 1.5,
  SEARCH_RESULT_IMPRESSION: 0,
  DWELL_POSITIVE: 2,
  DWELL_NEGATIVE: -1,
};

/** Blend weights for final learning rank (must sum to 1 for interpretability). */
export const LEARNING_RANK_BLEND = {
  baseRanking: 0.5,
  behavior: 0.3,
  contextMatch: 0.15,
  recentTrend: 0.05,
} as const;

/** Max boost from personalization vs base (avoid filter bubbles). */
export const MAX_CONTEXT_MATCH_BOOST = 0.12;

/** Minimum raw events before behavior score moves far from neutral. */
export const MIN_EVENTS_FOR_STRONG_SIGNAL = 8;

/** Neutral behavior score when data is sparse. */
export const NEUTRAL_BEHAVIOR_SCORE = 0.5;
