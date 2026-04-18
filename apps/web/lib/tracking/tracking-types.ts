/**
 * Client + API event names for LECIPM Growth Engine.
 * Authoritative persistence: `traffic_events` (high volume) + `growth_events` (deterministic, allowlisted).
 * Verified conversions (`signup_success`, `booking_completed` in growth_events) are server-only.
 */

/** Names accepted by `/api/analytics/track` — see `ALLOWED_CLIENT_TRACKING_EVENT_TYPES`. */
export type LecipmClientEventName = string;

export type TrackingMetadata = Record<string, unknown>;

export type ClientTrackingPayload = {
  eventName: LecipmClientEventName;
  userId?: string | null;
  sessionId?: string | null;
  metadata?: TrackingMetadata;
  /** Full path including query — defaults to `window.location`. */
  path?: string | null;
  /** ISO timestamp when the event occurred (client clock). */
  timestamp?: string;
};

/** Canonical growth funnel labels stored in DB (`growth_events.event_name`). */
export const GrowthDbEventName = {
  PAGE_VIEW: "page_view",
  LISTING_VIEW: "listing_view",
  SIGNUP_SUCCESS: "signup_success",
  LOGIN: "login",
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  HOST_SIGNUP: "host_signup",
  LISTING_CREATED: "listing_created",
  BROKER_LEAD: "broker_lead",
  DEAL_CREATED: "deal_created",
  CTA_CLICK: "cta_click",
} as const;

export type GrowthDbEventNameType = (typeof GrowthDbEventName)[keyof typeof GrowthDbEventName];
