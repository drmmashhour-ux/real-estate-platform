/**
 * Best-effort client analytics — never throws.
 * POST /api/analytics/event → `syria_growth_events`.
 *
 * Self-marketing funnel (lightweight, no extra dashboards):
 * - **Views** — server: `listing_view` on public listing page load.
 * - **Shares** — `listing_shared` with `source`: `whatsapp` | `copy_link` (and optional `source: "ai_growth"` from growth block).
 * - **Owner lead taps** — DB counters via `/api/lead/whatsapp` (not this helper).
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
