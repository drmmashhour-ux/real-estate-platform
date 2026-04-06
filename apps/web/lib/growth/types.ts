/**
 * LECIPM Manager — typed growth funnel (0→1000 launch engine).
 * Persisted primarily in `growth_funnel_events` via `recordLecipmManagerGrowthEvent`.
 */

export const MANAGER_GROWTH_EVENT_NAMES = [
  "landing_page_viewed",
  "listings_browse_viewed",
  "listing_viewed",
  "contact_host_clicked",
  "booking_request_started",
  "booking_request_submitted",
  "checkout_started",
  "payment_completed",
  "manual_payment_marked_received",
  "booking_confirmed",
  "host_signup_started",
  "host_signup_completed",
  "listing_created",
  "listing_published",
  "language_switched",
  "market_mode_used",
  "ai_suggestion_accepted",
] as const;

export type GrowthEventName = (typeof MANAGER_GROWTH_EVENT_NAMES)[number];

export type GrowthUiLocale = "en" | "fr" | "ar";

export interface GrowthEvent {
  name: GrowthEventName;
  userId?: string | null;
  listingId?: string | null;
  marketCode?: string | null;
  locale?: GrowthUiLocale | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type GrowthEventInput = Omit<GrowthEvent, "createdAt" | "name">;
