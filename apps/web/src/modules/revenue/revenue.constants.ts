/** Max points added to browse/search score from revenue proxies (trust-preserving cap). */
export const REVENUE_RANKING_BLEND_MAX_POINTS = 2;

/** Weight env override: points = min(MAX, WEIGHT * revenue01) */
export const REVENUE_RANKING_WEIGHT_ENV = "REVENUE_RANKING_WEIGHT";

/** Heuristic: listing older than N days without update = stale for discount strategy hints. */
export const STALE_LISTING_DAYS = 45;

/** Minimum comparable sample for median-based pricing confidence. */
export const MIN_COMPARABLE_LISTINGS = 6;
