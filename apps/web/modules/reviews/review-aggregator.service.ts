/**
 * Aggregates BNHub `Review` rows — uses real ratings only (no synthesis).
 */
import { prisma } from "@/lib/db";

export async function aggregateListingReviews(listingId: string) {
  const [agg, countHeld, countTotal] = await Promise.all([
    prisma.review.aggregate({
      where: { listingId },
      _avg: { propertyRating: true },
      _count: { _all: true },
    }),
    prisma.review.count({
      where: { listingId, moderationHeld: true },
    }),
    prisma.review.count({ where: { listingId } }),
  ]);

  const averageScore =
    agg._avg.propertyRating != null && Number.isFinite(agg._avg.propertyRating)
      ? Math.round((agg._avg.propertyRating as number) * 100) / 100
      : null;

  return {
    averageScore,
    reviewCount: countTotal,
    visibleForAggregationCount: countTotal - countHeld,
    moderationHeldCount: countHeld,
  };
}
