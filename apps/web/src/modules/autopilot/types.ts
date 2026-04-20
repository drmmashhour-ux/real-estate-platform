/** Domains persisted on `LecipmCoreAutopilotAction.domain` (varchar). */
export type AutopilotDomain =
  | "listing"
  | "growth"
  | "trust"
  | "revenue"
  | "COOWNERSHIP_COMPLIANCE";

/** Initial event set for Core Autopilot v1 — extend with typed payloads per event. */
export type LecipmCoreAutopilotEventType =
  | "listing_created"
  | "listing_updated"
  | "scheduled_scan"
  | "listing_published"
  | "listing_low_conversion_detected"
  | "listing_low_quality_detected"
  | "search_no_results_detected"
  | "user_saved_listing"
  | "inquiry_created"
  | "booking_created"
  | "booking_cancelled"
  | "stale_listing_detected"
  | "price_drop_detected";

export type LecipmCoreAutopilotExecutionMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type LecipmCoreAutopilotEventPayload = {
  eventType: LecipmCoreAutopilotEventType;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};
