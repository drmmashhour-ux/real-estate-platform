/** Thresholds and caps — tune via env later; keep conservative defaults. */
export const GROWTH_V2 = {
  MIN_ACTIVE_LISTINGS_SEO: 6,
  MIN_PROPERTY_TYPE_DIVERSITY: 2,
  MIN_FRESH_LISTINGS_RATIO: 0.15,
  MAX_SEO_CANDIDATES_PER_RUN: 400,
  MAX_SOCIAL_CANDIDATES_PER_RUN: 80,
  MAX_CAMPAIGN_CANDIDATES_PER_RUN: 200,
  MIN_PHOTOS_FOR_SOCIAL: 4,
  REFERRAL_ATTRIBUTION_WINDOW_DAYS: 30,
  CAMPAIGN_COOLDOWN_HOURS_BY_KIND: {
    price_drop_alert: 72,
    watchlist_digest: 168,
    similar_listing_alert: 48,
    broker_followup: 24,
    host_optimization_reminder: 168,
    default: 48,
  } as Record<string, number>,
  /** Minimum CRM lead score (0–100) for broker_followup candidates — reduces noisy rows. */
  MIN_LEAD_SCORE_FOR_BROKER_CAMPAIGN: 48,
  /** FSBO listing trust floor (nullable = unknown; still eligible but ranked lower upstream). */
  MIN_TRUST_SCORE_HOST_CAMPAIGN_FSBO: 48,
  /** Minimum buyer listing views vs max leads for host optimization candidates. */
  HOST_CAMPAIGN_MIN_VIEWS: 60,
  HOST_CAMPAIGN_MAX_LEADS: 1,
  /** FSBO listing must exceed this composite ranking score (0–100) for v1 newsletter candidates. */
  MIN_RANKING_SCORE_FOR_NEWSLETTER_CANDIDATE: 68,
} as const;
