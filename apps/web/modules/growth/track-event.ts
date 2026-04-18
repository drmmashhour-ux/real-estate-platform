/**
 * Client entry for growth-friendly tracking. Prefer importing from `@/lib/tracking/events`
 * (`trackEvent`) which posts to `/api/analytics/track` and hydrates `growth_events` for allowlisted names.
 *
 * Server-only conversions (`signup_success`, `booking_completed`, …) are recorded in API routes —
 * never call those from the browser as fake conversions.
 */

export { trackEvent, GrowthTrackEvent } from "@/lib/tracking/events";
export { GrowthEventName, type GrowthEventNameType } from "./event-types";
