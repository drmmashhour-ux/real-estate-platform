/**
 * BNHUB / listings retargeting — maps product + `track()` events to ad platforms.
 * @see docs/growth/retargeting-playbook.md
 */

/** First-party `/api/analytics/track` + PostHog / Plausible event names */
export const RetargetingFirstPartyEvent = {
  pageView: "page_view",
  listingView: "listing_view",
  listingViewedProduct: "listing_viewed",
  scroll50: "scroll_50",
  ctaClick: "cta_click",
  adClick: "ad_click",
  bookingClick: "booking_click",
  /** Canonical `/api/analytics/track` + TrafficEvent name when a BNHUB booking is created (client). */
  bookingStarted: "booking_started",
  bookingCompleted: "booking_completed",
} as const;

/**
 * Meta Pixel standard events (Events Manager → audiences & optimization).
 * Funnel: PageView → ViewContent → AddToCart → InitiateCheckout → Purchase
 */
export const MetaPixelStandardEvent = {
  pageView: "PageView",
  viewContent: "ViewContent",
  addToCart: "AddToCart",
  initiateCheckout: "InitiateCheckout",
  purchase: "Purchase",
} as const;
