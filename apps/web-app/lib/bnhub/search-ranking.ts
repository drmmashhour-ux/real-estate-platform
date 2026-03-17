import { prisma } from "@/lib/db";

/** Default weights for ranking signals (used when no config in DB). */
export const DEFAULT_RANKING_WEIGHTS: Record<string, number> = {
  verification: 30,
  superHost: 25,
  hostQualityScore: 5,
  reviewScore: 4,
  reviewCount: 1.5,
  conversion: 3,
};

/** Listing shape for ranking score (used by search and tests). */
export type ListingForRanking = {
  verificationStatus: string;
  owner?: { hostQuality?: { qualityScore: number; isSuperHost: boolean } | null } | null;
  _count: { reviews: number; bookings: number };
  reviews: { propertyRating: number }[];
};

/**
 * Smart ranking: listing quality, verification, host score, review score, conversion.
 * Uses configurable weights. Exported for tests and used by searchListings.
 */
export function computeListingRankScore(
  listing: ListingForRanking,
  weights: Record<string, number> = {}
): number {
  const w = (k: string, d: number) => weights[k] ?? d;
  let score = 0;
  if (listing.verificationStatus === "VERIFIED") score += w("verification", 30);
  const hq = listing.owner?.hostQuality;
  if (hq?.isSuperHost) score += w("superHost", 25);
  if (hq?.qualityScore) score += hq.qualityScore * w("hostQualityScore", 5);
  const avgRating =
    listing.reviews.length > 0
      ? listing.reviews.reduce((s, r) => s + r.propertyRating, 0) / listing.reviews.length
      : 0;
  score += avgRating * w("reviewScore", 4);
  score += Math.min(15, listing._count.reviews * (w("reviewCount", 1.5)));
  const conversion = listing._count.bookings > 0 ? listing._count.reviews / listing._count.bookings : 0;
  score += Math.min(10, conversion * w("conversion", 3));
  return score;
}

export type RankingWeights = Record<string, number>;

/**
 * Get current ranking weights from DB, or defaults.
 * Used by search to compute listing rank score.
 */
export async function getRankingWeights(): Promise<RankingWeights> {
  const rows = await prisma.searchRankingConfig.findMany();
  if (rows.length === 0) return DEFAULT_RANKING_WEIGHTS;
  const weights: RankingWeights = { ...DEFAULT_RANKING_WEIGHTS };
  for (const r of rows) weights[r.key] = r.weight;
  return weights;
}

/**
 * Set weight for a ranking key (admin). Creates or updates config.
 */
export async function setRankingWeight(
  key: string,
  weight: number,
  description?: string
) {
  return prisma.searchRankingConfig.upsert({
    where: { key },
    create: { key, weight, description },
    update: { weight, description },
  });
}

/**
 * Set multiple weights at once (admin).
 */
export async function setRankingWeights(weights: Record<string, number>) {
  const results = [];
  for (const [key, weight] of Object.entries(weights)) {
    results.push(await setRankingWeight(key, weight));
  }
  return results;
}
