import { prisma } from "@/lib/db";
import { SY8_REPORTS_THRESHOLD } from "@/lib/sy8/sy8-constants";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";

/** Combined S1 + SYBNB report rows for one property. */
export async function countReportsForProperty(propertyId: string): Promise<number> {
  const [nSyria, nSybnb] = await Promise.all([
    prisma.syriaListingReport.count({ where: { propertyId } }),
    prisma.listingReport.count({ where: { listingId: propertyId } }),
  ]);
  return nSyria + nSybnb;
}

/** All reports on any of the owner’s listings (both report tables). */
export async function countTotalReportsForOwner(ownerId: string): Promise<number> {
  const properties = await prisma.syriaProperty.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const ids = properties.map((p) => p.id);
  if (ids.length === 0) {
    return 0;
  }
  const [nSyria, nSybnb] = await Promise.all([
    prisma.syriaListingReport.count({ where: { propertyId: { in: ids } } }),
    prisma.listingReport.count({ where: { listingId: { in: ids } } }),
  ]);
  return nSyria + nSybnb;
}

/**
 * SY8-2 / SYBNB-84: after a new report, apply queue thresholds.
 * - ≥5 reports on this listing → `needsReview: true` + `status: NEEDS_REVIEW` (hidden from guest feeds until cleared)
 * - ≥5 reports total for this seller (all listings) → `owner.flagged`
 */
export async function applySy8ReportThresholds(propertyId: string): Promise<void> {
  const id = propertyId.trim();
  if (!id) {
    return;
  }
  const p = await prisma.syriaProperty.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  if (!p) {
    return;
  }
  const nListing = await countReportsForProperty(p.id);
  const nSeller = await countTotalReportsForOwner(p.ownerId);
  if (nListing >= SY8_REPORTS_THRESHOLD) {
    await prisma.syriaProperty.update({
      where: { id: p.id },
      data: { needsReview: true, status: "NEEDS_REVIEW" },
    });
  }
  if (nSeller >= SY8_REPORTS_THRESHOLD) {
    await prisma.syriaAppUser.update({ where: { id: p.ownerId }, data: { flagged: true } });
  }
  await recomputeReputationScoreForUser(p.ownerId);
}
