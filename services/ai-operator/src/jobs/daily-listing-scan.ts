import { config } from "../config.js";
import { analyzeListing } from "../services/operator-service.js";

export async function runDailyListingScan(): Promise<{ processed: number }> {
  if (!config.listingsServiceUrl) {
    console.log("[daily-listing-scan] LISTINGS_SERVICE_URL not set; skip.");
    return { processed: 0 };
  }
  try {
    const res = await fetch(`${config.listingsServiceUrl}/listings?limit=100&status=SUBMITTED`);
    const data = res.ok ? await res.json() : { listings: [] };
    const listings = Array.isArray(data) ? data : data.listings ?? [];
    for (const l of listings) {
      analyzeListing({
        listingId: l.id,
        title: l.title ?? "",
        description: l.description,
        amenities: l.amenities,
        photoCount: l.photos?.length ?? l.photoCount ?? 0,
        houseRules: l.houseRules,
        nightPriceCents: l.nightPriceCents,
      });
    }
    console.log("[daily-listing-scan] Processed", listings.length, "listings");
    return { processed: listings.length };
  } catch (e) {
    console.error("[daily-listing-scan]", e);
    return { processed: 0 };
  }
}
