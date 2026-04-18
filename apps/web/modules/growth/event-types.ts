/**
 * Canonical names stored in `growth_events.event_name`.
 * Keep in sync with `tracking.service.ts` allowlists.
 */
export const GrowthEventName = {
  PAGE_VIEW: "page_view",
  /** Paid / marketing landings (`/ads/*`) — client-ingest allowlisted. */
  LANDING_VIEW: "landing_view",
  /** Product search (home, search page, BNHub filters) — client-ingest allowlisted. */
  SEARCH: "search",
  LISTING_VIEW: "listing_view",
  SIGNUP_SUCCESS: "signup_success",
  LOGIN: "login",
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  HOST_SIGNUP: "host_signup",
  LISTING_CREATED: "listing_created",
  BROKER_LEAD: "broker_lead",
  /** Public or growth lead form submission — server-only. */
  LEAD_CAPTURE: "lead_capture",
  DEAL_CREATED: "deal_created",
  CTA_CLICK: "cta_click",
} as const;

export type GrowthEventNameType = (typeof GrowthEventName)[keyof typeof GrowthEventName];

export function isGrowthEventName(s: string): s is GrowthEventNameType {
  return (Object.values(GrowthEventName) as string[]).includes(s);
}
