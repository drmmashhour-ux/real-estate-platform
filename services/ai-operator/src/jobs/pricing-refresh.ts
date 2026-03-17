import { config } from "../config.js";
import { recommendPricing } from "../services/operator-service.js";

export async function runPricingRefresh(): Promise<{ processed: number }> {
  if (!config.listingsServiceUrl) {
    console.log("[pricing-refresh] LISTINGS_SERVICE_URL not set; skip.");
    return { processed: 0 };
  }
  try {
    const res = await fetch(`${config.listingsServiceUrl}/listings?limit=50`);
    const data = res.ok ? await res.json() : { listings: [] };
    const listings = Array.isArray(data) ? data : data.listings ?? [];
    for (const l of listings) {
      recommendPricing({
        listingId: l.id,
        location: l.city ?? l.location ?? "Unknown",
        currentPriceCents: l.nightPriceCents,
      });
    }
    console.log("[pricing-refresh] Processed", listings.length, "listings");
    return { processed: listings.length };
  } catch (e) {
    console.error("[pricing-refresh]", e);
    return { processed: 0 };
  }
}
