import { prisma } from "@/lib/db";

/**
 * Marks expired FSBO featured rows as `expired` when `endAt` is in the past.
 * Safe to run from cron; does not clear `FsboListing.featuredUntil` (UI can compare to now).
 */
export async function expireStaleFsboFeaturedRows(limit = 500): Promise<{ updated: number }> {
  const res = await prisma.featuredListing.updateMany({
    where: {
      listingKind: "fsbo",
      status: "active",
      endAt: { lt: new Date() },
    },
    data: { status: "expired" },
    // Prisma updateMany does not support take; rely on index + batch size via repeated calls if needed
  });
  void limit;
  return { updated: res.count };
}
