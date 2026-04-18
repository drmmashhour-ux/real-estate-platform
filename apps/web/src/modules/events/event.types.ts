import { GrowthEventName } from "@/modules/growth/event-types";

/**
 * Allowed names for POST /api/internal/growth-v3/events/ingest — aligned with `GrowthEventName`.
 */
export const GROWTH_EVENT_NAMES = Object.values(GrowthEventName) as readonly string[];

export type GrowthEventPayload = {
  name: string;
  userId?: string | null;
  sessionId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

/**
 * Platform intelligence events — persisted to `PlatformIntelligenceEvent` (auditable).
 * Add new types here + ensure callers use `logIntelligenceEvent`.
 */
export type PlatformIntelligenceEventName =
  | "listing_view"
  | "listing_click"
  | "listing_save"
  | "inquiry_sent"
  | "booking_created"
  | "booking_completed"
  | "price_changed"
  | "listing_updated"
  | "autopilot_action_executed"
  | "autopilot_action_accepted"
  | "autopilot_action_rejected";

export type LogIntelligenceEventInput = {
  type: PlatformIntelligenceEventName | (string & {});
  userId?: string | null;
  listingId?: string | null;
  payload?: Record<string, unknown>;
};

export type { ProductEventName } from "./event.constants";
