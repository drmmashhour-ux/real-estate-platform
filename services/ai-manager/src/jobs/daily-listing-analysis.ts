/**
 * Daily listing quality analysis job.
 * In production: fetch listings from LISTINGS_SERVICE_URL, run analyzeListingQuality, post results to webhook or store.
 */
import { config } from "../config.js";
import { analyzeListingQuality } from "../services/listing-quality.service.js";

export const JOB_NAME = "daily-listing-analysis";

export async function run(): Promise<{ processed: number; alerts: number }> {
  const listingsUrl = config.listingsServiceUrl;
  let listings: { id: string; title: string; description?: string; amenities?: string[]; photoCount?: number }[] = [];

  if (listingsUrl) {
    try {
      const res = await fetch(`${listingsUrl}/listings?limit=100`);
      if (res.ok) {
        const data = await res.json();
        listings = Array.isArray(data) ? data : data.listings ?? [];
      }
    } catch (e) {
      console.error(`[${JOB_NAME}] Failed to fetch listings:`, e);
      return { processed: 0, alerts: 0 };
    }
  }

  if (listings.length === 0) {
    console.log(`[${JOB_NAME}] No listings to process (set LISTINGS_SERVICE_URL to fetch).`);
    return { processed: 0, alerts: 0 };
  }

  let alerts = 0;
  for (const listing of listings) {
    const result = analyzeListingQuality({
      listingId: listing.id,
      title: listing.title,
      description: listing.description,
      amenities: listing.amenities,
      photoCount: listing.photoCount,
    });
    if (result.listingQualityScore < 60) alerts++;
  }
  console.log(`[${JOB_NAME}] Processed ${listings.length} listings, ${alerts} low-quality alerts.`);
  return { processed: listings.length, alerts };
}
