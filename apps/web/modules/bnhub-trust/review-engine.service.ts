import { prisma } from "@/lib/db";

/** Aggregated review stats only — never fabricates reviews. */
export async function getListingReviewStats(listingId: string): Promise<{
  count: number;
  average: number | null;
  moderatedHeld: number;
}> {
  const [agg, held] = await Promise.all([
    prisma.review.aggregate({
      where: { listingId, moderationHeld: false },
      _avg: { propertyRating: true },
      _count: { _all: true },
    }),
    prisma.review.count({ where: { listingId, moderationHeld: true } }),
  ]);
  return {
    count: agg._count._all,
    average: agg._avg.propertyRating != null ? agg._avg.propertyRating : null,
    moderatedHeld: held,
  };
}
