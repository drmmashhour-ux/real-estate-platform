import { prisma } from "@/lib/db";

/**
 * Active = live published listings (fraud off). Sold = archived listings + completed SYBNB stays
 * the host completed (reputation “sold / closed / fulfilled” signal).
 * Counts are independent of SY8 quarantine so labels stay explainable to sellers.
 */
export async function getSy8OwnerListingCounts(
  ownerId: string,
): Promise<{ activeListings: number; soldListings: number }> {
  const [activeListings, archivedListings, completedStays] = await Promise.all([
    prisma.syriaProperty.count({
      where: { ownerId, status: "PUBLISHED", fraudFlag: false },
    }),
    prisma.syriaProperty.count({
      where: { ownerId, status: "ARCHIVED" },
    }),
    prisma.sybnbBooking.count({
      where: { hostId: ownerId, status: "completed" },
    }),
  ]);
  return { activeListings, soldListings: archivedListings + completedStays };
}

/** Batch: one query per owner in parallel — suitable for small owner sets on a search page. */
export async function getSy8OwnerListingCountsMap(
  ownerIds: string[],
): Promise<Map<string, { activeListings: number; soldListings: number }>> {
  const unique = [...new Set(ownerIds)].filter(Boolean);
  const map = new Map<string, { activeListings: number; soldListings: number }>();
  await Promise.all(
    unique.map(async (id) => {
      const c = await getSy8OwnerListingCounts(id);
      map.set(id, c);
    }),
  );
  return map;
}
