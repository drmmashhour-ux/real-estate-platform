/**
 * Best-effort client analytics — never throws.
 * POST /api/analytics/event → syria_growth_events.
 */
export async function trackListingSharedClient(
  listingId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "listing_shared",
        propertyId: listingId,
        payload: { listingId, ...payload },
      }),
    });
  } catch {
    /* ignore */
  }
}
