import { getListingById } from "@/lib/bnhub/listings";
import { prisma } from "@/lib/db";

/** Demo listing ids aligned with design-studio / listing-exists. */
const DEMO_TITLE: Record<string, string> = {
  "1": "Luxury Villa",
  "test-listing-1": "Luxury Villa",
  "demo-listing-montreal": "Cozy loft in Old Montreal",
};

/**
 * Resolves a display title for a listing id used on offers and CRM.
 * Tries broker CRM `Listing` first, then BNHUB `ShortTermListing` (vacation rentals).
 */
export async function resolveListingTitle(listingId: string): Promise<string | null> {
  const demo = DEMO_TITLE[listingId];
  if (demo) return demo;

  const core = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true },
  });
  if (core?.title?.trim()) return core.title.trim();

  const row = await getListingById(listingId);
  return row?.title?.trim() || null;
}
