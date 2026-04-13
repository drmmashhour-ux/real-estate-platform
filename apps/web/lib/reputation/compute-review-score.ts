import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { scaleStarRatingTo100 } from "@/lib/reputation/validators";

/**
 * 0–100 from published platform reputation reviews + BNHub aggregates when applicable.
 */
export async function computeReviewScoreComponent(
  entityType: ReputationEntityType,
  entityId: string
): Promise<{ score: number; detail: Record<string, unknown> }> {
  const published = await prisma.reputationReview.findMany({
    where: {
      subjectEntityType: entityType,
      subjectEntityId: entityId,
      status: "published",
    },
    select: { rating: true },
  });

  if (published.length > 0) {
    const avg = published.reduce((a, r) => a + r.rating, 0) / published.length;
    return {
      score: scaleStarRatingTo100(avg),
      detail: { source: "platform_reviews", count: published.length, avg },
    };
  }

  if (entityType === "listing") {
    const agg = await prisma.propertyRatingAggregate.findUnique({
      where: { listingId: entityId },
      select: { avgRating: true, totalReviews: true },
    });
    if (agg && agg.totalReviews > 0 && agg.avgRating != null) {
      return {
        score: scaleStarRatingTo100(agg.avgRating),
        detail: { source: "bnhub_aggregate", totalReviews: agg.totalReviews, avgRating: agg.avgRating },
      };
    }
  }

  if (entityType === "host") {
    const listings = await prisma.shortTermListing.findMany({
      where: { ownerId: entityId },
      select: { id: true },
    });
    const ids = listings.map((l) => l.id);
    if (ids.length === 0) return { score: 48, detail: { source: "neutral", reason: "no_listings" } };
    const aggs = await prisma.propertyRatingAggregate.findMany({
      where: { listingId: { in: ids } },
      select: { avgRating: true, totalReviews: true },
    });
    let w = 0;
    let s = 0;
    for (const a of aggs) {
      const n = a.totalReviews ?? 0;
      if (n > 0 && a.avgRating != null) {
        s += a.avgRating * n;
        w += n;
      }
    }
    if (w > 0) {
      const avg = s / w;
      return {
        score: scaleStarRatingTo100(avg),
        detail: { source: "bnhub_listings_blend", listings: ids.length, weightedAvg: avg },
      };
    }
  }

  return { score: 50, detail: { source: "default_mid", reason: "insufficient_reviews" } };
}
