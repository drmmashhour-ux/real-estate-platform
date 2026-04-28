/**
 * Best-effort client analytics — never throws.
 * POST `/api/analytics/event` → `syria_growth_events`.
 *
 * Viral funnel:
 * - **Shares** — `listing_shared` with `payload.source`: `whatsapp` | `copy_link` | `copy_full_message`.
 * - **Attributed visits** — server `listing_view` when URL includes `?hl_share=whatsapp` or `?hl_share=copy_link` (`payload.shareSource`).
 *
 * Owner lead taps increment SyriaGrowthEvent `contact_click` via `/api/lead/whatsapp|phone` (see `lead-increment.ts`).
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
