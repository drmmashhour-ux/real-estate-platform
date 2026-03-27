import { getListingById } from "@/lib/bnhub/listings";

const DEMO_LISTING_IDS = new Set(["1", "test-listing-1", "demo-listing-montreal"]);

export async function assertListingExists(listingId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  if (!listingId || typeof listingId !== "string") {
    return { ok: false, status: 400, error: "listingId is required" };
  }
  if (DEMO_LISTING_IDS.has(listingId)) return { ok: true };
  const row = await getListingById(listingId);
  if (!row) return { ok: false, status: 404, error: "Listing not found" };
  return { ok: true };
}
