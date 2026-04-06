/**
 * Canonical hub analytics event names — include hubKey + entity in metadata.
 */

export type HubAnalyticsEventName =
  | "hub_listing_view"
  | "hub_listing_created"
  | "hub_booking_started"
  | "hub_booking_completed"
  | "hub_message_sent"
  | "hub_ai_recommendation_created"
  | "hub_search"
  | "hub_filter_applied";

export type HubAnalyticsPayload = {
  hubKey: string;
  entityType?: string;
  entityId?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export function buildHubAnalyticsPayload(input: HubAnalyticsPayload): HubAnalyticsPayload {
  return {
    hubKey: input.hubKey,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    metadata: input.metadata ?? {},
  };
}
