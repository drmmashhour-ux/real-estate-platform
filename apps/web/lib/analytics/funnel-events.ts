/**
 * BNHUB stay funnel — `TrafficEvent.event_type` values for drop-off analysis (see `traffic_events`).
 * Order: ad_click → listing_view → scroll_50 → cta_click → booking_started (→ booking_completed).
 *
 * Note: `booking_start` is accepted by `/api/analytics/track` and normalized to `booking_started`.
 */
export const BNHUB_FUNNEL_EVENT = {
  AD_CLICK: "ad_click",
  LISTING_VIEW: "listing_view",
  SCROLL_50: "scroll_50",
  CTA_CLICK: "cta_click",
  BOOKING_START: "booking_started",
} as const;
