/** Product analytics event names — stable for GA4, Plausible, and PostHog. */
export const ProductAnalyticsEvents = {
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  LISTING_VIEWED: "listing_viewed",
  /** Search / filter apply on listings or BNHUB stays map search. */
  SEARCH_USAGE: "search_usage",
} as const;

export type ProductAnalyticsEventName = (typeof ProductAnalyticsEvents)[keyof typeof ProductAnalyticsEvents];
