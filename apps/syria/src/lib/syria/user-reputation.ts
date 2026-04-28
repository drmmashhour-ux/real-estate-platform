import { prisma } from "@/lib/db";
import { SY8_REPORTS_THRESHOLD } from "@/lib/sy8/sy8-constants";
import { recomputeSy8FeedRankForPropertyId } from "@/lib/sy8/sy8-feed-rank-refresh";

/** ORDER SYBNB-98 — listings considered “good” for +1 each (healthy published inventory). */
function goodListingWhere(ownerId: string) {
  return {
    ownerId,
    status: "PUBLISHED" as const,
    fraudFlag: false,
    needsReview: false,
  };
}

async function combinedReportsForListing(propertyId: string): Promise<number> {
  const [nSyria, nSybnb] = await Promise.all([
    prisma.syriaListingReport.count({ where: { propertyId } }),
    prisma.listingReport.count({ where: { listingId: propertyId } }),
  ]);
  return nSyria + nSybnb;
}

async function ownerHasListingReportThreshold(ownerId: string): Promise<boolean> {
  const listings = await prisma.syriaProperty.findMany({
    where: { ownerId },
    select: { id: true },
  });
  for (const { id } of listings) {
    if ((await combinedReportsForListing(id)) >= SY8_REPORTS_THRESHOLD) return true;
  }
  return false;
}

/** Pure aggregate formula — persisted as `SyriaAppUser.reputationScore`. */
export async function computeReputationScoreFromAggregates(ownerId: string): Promise<number> {
  const id = ownerId.trim();
  if (!id) return 0;

  const user = await prisma.syriaAppUser.findUnique({
    where: { id },
    select: {
      phoneVerified: true,
      phoneVerifiedAt: true,
      flagged: true,
    },
  });
  if (!user) return 0;

  let score = 0;
  if (user.phoneVerified || user.phoneVerifiedAt != null) score += 5;

  const [
    verifiedListingCount,
    goodListingCount,
    syriaCompletedAsHost,
    sybnbCompletedAsHost,
    reportThresholdHit,
  ] = await Promise.all([
    prisma.syriaProperty.count({
      where: {
        ownerId: id,
        OR: [{ listingVerified: true }, { verified: true }],
      },
    }),
    prisma.syriaProperty.count({ where: goodListingWhere(id) }),
    prisma.syriaBooking.count({
      where: { status: "COMPLETED", property: { ownerId: id } },
    }),
    prisma.sybnbBooking.count({
      where: { hostId: id, status: "completed" },
    }),
    ownerHasListingReportThreshold(id),
  ]);

  if (verifiedListingCount > 0) score += 5;
  score += (syriaCompletedAsHost + sybnbCompletedAsHost) * 3;
  score += goodListingCount * 1;
  if (user.flagged) score -= 10;
  if (reportThresholdHit) score -= 5;

  return Math.max(-999, Math.min(9999, score));
}

export type UserReputationTier = "new" | "trusted" | "star";

/** ORDER SYBNB-98 labels: 0–5 / 6–15 / 16+ */
export function reputationTierFromScore(score: number): UserReputationTier {
  if (score <= 5) return "new";
  if (score <= 15) return "trusted";
  return "star";
}

/** Persist score and refresh SY8 rank for every listing owned (picks up reputation boost). */
export async function recomputeReputationScoreForUser(ownerId: string): Promise<void> {
  const id = ownerId.trim();
  if (!id) return;

  const score = await computeReputationScoreFromAggregates(id);
  await prisma.syriaAppUser.update({
    where: { id },
    data: { reputationScore: score },
  });

  const listings = await prisma.syriaProperty.findMany({
    where: { ownerId: id },
    select: { id: true },
  });
  await Promise.all(listings.map(({ id: pid }) => recomputeSy8FeedRankForPropertyId(pid)));
}
