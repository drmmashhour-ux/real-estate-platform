/** Product analytics event names — stable for GA4, Plausible, and PostHog. */
export const ProductAnalyticsEvents = {
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  LISTING_VIEWED: "listing_viewed",
  /** Search / filter apply on listings or BNHUB stays map search. */
  SEARCH_USAGE: "search_usage",
  /** Marketing landing v1 — conversion funnel (GA4 / PostHog / Plausible). */
  LANDING_HERO_CTA: "hero_cta_click",
  LANDING_ROI_CTA: "roi_cta_click",
  LANDING_ONBOARDING_CTA: "onboarding_cta_click",
  LANDING_PRICING_VIEW: "pricing_view",
  LANDING_SCROLL_DEPTH: "scroll_depth",
} as const;

export type ProductAnalyticsEventName = (typeof ProductAnalyticsEvents)[keyof typeof ProductAnalyticsEvents];
