/**
 * Deterministic thresholds for preview metric signals — single source of truth.
 */

/** Views at or below this level are treated as low visibility for preview heuristics. */
export const PREVIEW_LOW_VIEWS_MAX = 50;

/** Views at or above this level are treated as healthy visibility. */
export const PREVIEW_HEALTHY_VIEWS_MIN = 51;

/** Bookings at or below this level are treated as low booking-style interest. */
export const PREVIEW_LOW_BOOKINGS_MAX = 2;

/** Bookings above this band are treated as healthy booking-style interest. */
export const PREVIEW_HEALTHY_BOOKINGS_MIN = 3;

/** Conversion proxy below this ratio suggests weak funnel engagement. */
export const PREVIEW_WEAK_CONVERSION_MAX = 0.03;

/** Conversion proxy at or above suggests healthy funnel engagement. */
export const PREVIEW_HEALTHY_CONVERSION_MIN = 0.08;
