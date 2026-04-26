import { getListingById } from "@/lib/bnhub/listings";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

const DEMO_LISTING_IDS = new Set(["1", "test-listing-1", "demo-listing-montreal"]);

export async function assertListingExists(listingId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  if (!listingId || typeof listingId !== "string") {
    return { ok: false, status: 400, error: "listingId is required" };
  }
  if (DEMO_LISTING_IDS.has(listingId)) return { ok: true };
  const row = await getListingById(listingId);
  if (row) return { ok: true };

  const crm = await prisma.listing.findFirst({
    where: { id: listingId, crmMarketplaceLive: true },
    select: { id: true },
  });
  if (crm) return { ok: true };

  const fsbo = await prisma.fsboListing.findFirst({
    where: { id: listingId, status: "ACTIVE", moderationStatus: "APPROVED", archivedAt: null },
    select: { id: true },
  });
  if (fsbo) return { ok: true };

  return { ok: false, status: 404, error: "Listing not found" };
}
