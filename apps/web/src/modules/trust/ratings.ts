import { prisma } from "@/lib/db";

export type ListingRatingSummary = {
  listingId: string;
  averageStars: number | null;
  reviewCount: number;
};

/**
 * Aggregate guest reviews for a BNHUB stay (demand-side trust signal).
 */
export async function getListingRatingSummary(listingId: string): Promise<ListingRatingSummary> {
  const agg = await prisma.review.aggregate({
    where: { listingId },
    _avg: { propertyRating: true },
    _count: { id: true },
  });
  return {
    listingId,
    averageStars: agg._avg.propertyRating,
    reviewCount: agg._count.id,
  };
}
