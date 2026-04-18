/**
 * Trigger registry — names only; execution stays explicit in jobs/cron later.
 */
export const GROWTH_TRIGGERS = [
  "stale_listing_14d",
  "new_host_signup",
  "booking_abandoned",
  "seller_lead_inactive_7d",
] as const;
