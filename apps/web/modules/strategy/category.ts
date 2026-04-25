/**
 * LECIPM product category — used for positioning and internal strategy dashboards.
 * Avoid comparative superlatives in customer-facing copy; pair with measured metrics.
 */

export const LECIPM_CATEGORY =
  "AI-driven real estate decision and brokerage intelligence platform" as const;

export type LecipmCategory = typeof LECIPM_CATEGORY;

/** Short label for nav / meta where space is limited */
export const LECIPM_CATEGORY_SHORT = "Real estate decision & brokerage intelligence" as const;
