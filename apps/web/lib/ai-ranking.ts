/**
 * Search Ranking Optimization – AI ranking score, explanations, integration with search.
 * Uses listing quality, host quality, conversion, reviews; stores SearchRankingScore.
 */
import { prisma } from "@/lib/db";
import { computeListingRankScore, getRankingWeights } from "@/lib/bnhub/search-ranking";
import type { ListingForRanking } from "@/lib/bnhub/search-ranking";

const RANKING_MODEL_VERSION = "ranking_v1";

export type RankingExplanation = {
  factor: string;
  contribution: number;
  description: string;
};

/**
 * Compute AI ranking score and factor breakdown for a listing.
 */
export function computeAiRankingScore(
  listing: ListingForRanking,
  weights: Record<string, number>
): { score: number; factors: RankingExplanation[] } {
  const explanations: RankingExplanation[] = [];
  const w = (k: string, d: number) => weights[k] ?? d;

  let score = 0;
  if (listing.verificationStatus === "VERIFIED") {
    const c = w("verification", 30);
    score += c;
    explanations.push({ factor: "verification", contribution: c, description: "Verified listing" });
  }
  const hq = listing.owner?.hostQuality;
  if (hq?.isSuperHost) {
    const c = w("superHost", 25);
    score += c;
    explanations.push({ factor: "superHost", contribution: c, description: "Super Host" });
  }
  if (hq?.qualityScore) {
    const c = hq.qualityScore * w("hostQualityScore", 5);
    score += c;
    explanations.push({
      factor: "hostQualityScore",
      contribution: c,
      description: `Host score ${hq.qualityScore.toFixed(1)}`,
    });
  }
  const avgRating =
    listing.reviews.length > 0
      ? listing.reviews.reduce((s, r) => s + r.propertyRating, 0) / listing.reviews.length
      : 0;
  if (avgRating > 0) {
    const c = avgRating * w("reviewScore", 4);
    score += c;
    explanations.push({
      factor: "reviewScore",
      contribution: c,
      description: `Avg rating ${avgRating.toFixed(1)}`,
    });
  }
  const reviewBonus = Math.min(15, listing._count.reviews * (w("reviewCount", 1.5)));
  score += reviewBonus;
  if (reviewBonus > 0) {
    explanations.push({
      factor: "reviewCount",
      contribution: reviewBonus,
      description: `${listing._count.reviews} reviews`,
    });
  }
  const conversion =
    listing._count.bookings > 0 ? listing._count.reviews / listing._count.bookings : 0;
  const convBonus = Math.min(10, conversion * w("conversion", 3));
  score += convBonus;
  if (convBonus > 0) {
    explanations.push({
      factor: "conversion",
      contribution: convBonus,
      description: "Booking-to-review conversion",
    });
  }

  return { score, factors: explanations };
}

/**
 * Compute and store SearchRankingScore for a listing.
 */
export async function computeAndStoreRankingScore(listingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { include: { hostQuality: true } },
      _count: { select: { reviews: true, bookings: true } },
      reviews: { select: { propertyRating: true } },
    },
  });
  if (!listing) return null;

  const weights = await getRankingWeights();
  const listingForRanking: ListingForRanking = {
    verificationStatus: listing.verificationStatus,
    owner: listing.owner,
    _count: listing._count,
    reviews: listing.reviews,
  };
  const { score, factors } = computeAiRankingScore(listingForRanking, weights);

  await prisma.searchRankingScore.create({
    data: {
      listingId,
      score,
      factors: factors as object,
      modelVersion: RANKING_MODEL_VERSION,
    },
  });
  return { score, factors };
}

/** Get latest ranking score for listing. */
export async function getListingRankingScore(listingId: string) {
  return prisma.searchRankingScore.findFirst({
    where: { listingId },
    orderBy: { computedAt: "desc" },
  });
}
