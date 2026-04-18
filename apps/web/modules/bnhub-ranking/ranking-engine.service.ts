import { prisma } from "@/lib/db";
import { computeListingRankScore, getRankingWeights, type ListingForRanking } from "@/lib/bnhub/search-ranking";
import type { BnhubRankingBundle } from "./bnhub-ranking.types";
import { buildRankingFeatureVector } from "./ranking-features.service";
import { resolveListingQualityScore } from "./listing-quality-score.service";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Computes explainable BNHub v2 scores for a listing. Does not invent reviews or prices.
 */
export async function computeBnhubRankingBundle(listingId: string): Promise<BnhubRankingBundle | null> {
  const [features, weights, quality, listing] = await Promise.all([
    buildRankingFeatureVector(listingId),
    getRankingWeights(),
    resolveListingQualityScore(listingId),
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      include: {
        owner: {
          include: {
            hostQuality: true,
          },
        },
        reviews: { select: { propertyRating: true }, take: 40 },
        _count: { select: { reviews: true, bookings: true } },
      },
    }),
  ]);

  if (!features || !listing) return null;

  const forLegacy: ListingForRanking = {
    verificationStatus: listing.verificationStatus,
    owner: {
      hostQuality: listing.owner?.hostQuality
        ? {
            qualityScore: listing.owner.hostQuality.qualityScore,
            isSuperHost: listing.owner.hostQuality.isSuperHost,
          }
        : null,
    },
    _count: { reviews: listing._count.reviews, bookings: listing._count.bookings },
    reviews: listing.reviews.map((r) => ({ propertyRating: r.propertyRating })),
  };

  const legacyBase = computeListingRankScore(forLegacy, weights);

  let trustScore = features.trustProfileScore != null ? features.trustProfileScore : 50;
  if (features.fraudOpenCount > 0) {
    trustScore = clamp(trustScore - features.fraudOpenCount * 8, 0, 100);
  }
  if (features.verified) {
    trustScore = clamp(trustScore + 5, 0, 100);
  }

  const totalB = Math.max(1, features.totalBookings);
  const completionRatio = features.completedStays / totalB;
  const cancelRatio = features.cancelledBookings / totalB;
  const conversionScore = clamp(
    Math.round(completionRatio * 70 + (1 - cancelRatio) * 30),
    0,
    100,
  );

  let rankingScore = legacyBase + trustScore * 0.15 + quality.qualityScore * 0.12 + conversionScore * 0.1;
  if (features.priceVsPeerRatio != null) {
    if (features.priceVsPeerRatio <= 1 && features.priceVsPeerRatio >= 0.75) {
      rankingScore += 6;
    }
    if (features.priceVsPeerRatio > 1.35) {
      rankingScore -= 4;
    }
  }
  rankingScore += clamp(14 - Math.min(14, features.recencyDays / 30), 0, 14);

  const reasons: string[] = [];
  reasons.push(`Legacy ranking blend (weighted signals): ${legacyBase.toFixed(1)}`);
  reasons.push(...quality.reasons.slice(0, 3));
  if (features.reviewCount > 0 && features.reviewAverage != null) {
    reasons.push(`Guest reviews: avg ${features.reviewAverage.toFixed(2)} · count ${features.reviewCount}`);
  }
  if (features.fraudOpenCount > 0) {
    reasons.push(`${features.fraudOpenCount} active fraud flag(s) reduce trust component`);
  }
  if (features.priceVsPeerRatio != null) {
    reasons.push(
      `Nightly price vs peer sample ratio: ${features.priceVsPeerRatio.toFixed(2)} (internal peers)`,
    );
  }
  reasons.push(`Cancellation share (bookings on file): ${(cancelRatio * 100).toFixed(0)}%`);

  return {
    rankingScore: Math.round(rankingScore * 10) / 10,
    qualityScore: quality.qualityScore,
    trustScore: Math.round(trustScore * 10) / 10,
    conversionScore,
    reasons,
  };
}
