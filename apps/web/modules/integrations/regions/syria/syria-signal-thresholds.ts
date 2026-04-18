/** Deterministic thresholds for Syria signal builder — tune via constants only. */

/** Minimum bookings to consider "meaningful activity" vs zero-booking signals. */
export const SYRIA_MIN_BOOKINGS_MEANINGFUL = 1;

/** Days since listing update to flag stale (published/active inventory). */
export const SYRIA_STALE_LISTING_DAYS = 90;

/** Payout pending count above paid count by this margin → anomaly hint. */
export const SYRIA_PAYOUT_PENDING_DOMINANCE = 2;

/** For low_conversion_high_views — requires explicit view metric in observation facts (no inference). */
export const SYRIA_VIEW_HIGH_THRESHOLD = 50;

/** Bookings at or below this count vs high views triggers conversion signal (when views metric exists). */
export const SYRIA_LOW_BOOKING_VS_VIEWS_MAX = 2;
