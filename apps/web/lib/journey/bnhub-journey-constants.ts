import type { AnalyticsFunnelEventName } from "@prisma/client";

/** Ordered BNHub conversion path (analytics_events.name). */
export const BNHUB_JOURNEY_STEPS: AnalyticsFunnelEventName[] = [
  "landing_visit",
  "search_used",
  "listing_click",
  "listing_view",
  "booking_started",
  "payment_completed",
];
