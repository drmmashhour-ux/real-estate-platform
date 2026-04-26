import { trackSyriaGrowthEvent } from "@/lib/growth-events";

/**
 * Server-side `trackEvent` for product analytics. Persists to `syria_growth_events`.
 * Example: `trackEvent("listing_featured_requested", { listingId: id })`
 */
export async function trackEvent(eventType: string, data: Record<string, unknown> = {}): Promise<void> {
  const listingId = typeof data.listingId === "string" ? data.listingId : null;
  const userId = typeof data.userId === "string" ? data.userId : null;
  await trackSyriaGrowthEvent({
    eventType,
    propertyId: listingId,
    userId: userId ?? undefined,
    payload: data,
  });
}
