import { trackClientAnalyticsEvent } from "@/lib/client-analytics";

const SESSION_KEY_PREFIX = "sybn134_f1_open_";

/**
 * SYBNB-134 — Count each listing once per browser session so sticky + inline CTAs do not double-count "opened".
 */
export function trackF1FunnelOpenedOnce(listingId: string, source: string): void {
  if (typeof window === "undefined") return;
  try {
    const k = `${SESSION_KEY_PREFIX}${listingId}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* private mode / quota */
  }
  trackClientAnalyticsEvent("f1_funnel_opened", { propertyId: listingId, payload: { source } });
}
