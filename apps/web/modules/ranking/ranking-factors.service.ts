import type { BnhubRankingBundle } from "@/modules/bnhub-ranking/bnhub-ranking.types";
import { computeListingQualityBundle } from "@/modules/reputation/listing-quality.service";
import { buildHostTrustSnapshot } from "@/modules/trust-scores/host-trust-score.service";
import { runReviewEngineForListing } from "@/modules/reviews/review-engine.service";

export type ReputationRankingFactors = {
  listingQuality: number;
  hostTrust: number;
  reviewStrength: number;
  conversionStrength: number;
  freshness: number;
  riskPenalty: number;
  pricingCompetitiveness: number;
};

export type UnifiedRankingExplanation = {
  rankingScore: number;
  factors: ReputationRankingFactors;
  reasons: string[];
  bundle: BnhubRankingBundle | null;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}

/**
 * Maps BNHub bundle + reputation modules into a stable factor grid for explainers / admin UI.
 */
export async function buildUnifiedRankingExplanation(
  listingId: string,
  hostUserId: string,
  bundle: BnhubRankingBundle | null,
  opts?: { recencyDays?: number | null; priceVsPeerRatio?: number | null },
): Promise<UnifiedRankingExplanation> {
  const [quality, host, reviews] = await Promise.all([
    computeListingQualityBundle(listingId),
    buildHostTrustSnapshot(hostUserId),
    runReviewEngineForListing(listingId),
  ]);

  const reviewStrength =
    reviews.reviewCount > 0 && reviews.averageScore != null
      ? clamp01((reviews.averageScore / 5) * 100 * Math.min(1, reviews.reviewCount / 10 + 0.4))
      : 35;

  const riskPenalty = clamp01(host.fraudPenaltyScore + (reviews.integrityStatus === "high_risk" ? 12 : 0));

  const recencyDays = opts?.recencyDays;
  const freshness =
    recencyDays != null && Number.isFinite(recencyDays)
      ? clamp01(100 - Math.min(90, recencyDays / 3.5))
      : 60;

  let pricingCompetitiveness = 55;
  const pvr = opts?.priceVsPeerRatio;
  if (pvr != null && Number.isFinite(pvr)) {
    if (pvr >= 0.75 && pvr <= 1.05) pricingCompetitiveness = 78;
    else if (pvr > 1.35) pricingCompetitiveness = 38;
    else pricingCompetitiveness = 55;
  }

  const factors: ReputationRankingFactors = {
    listingQuality: quality.qualityScore,
    hostTrust: host.hostTrustScore,
    reviewStrength,
    conversionStrength: bundle?.conversionScore ?? quality.conversionScore,
    freshness,
    riskPenalty,
    pricingCompetitiveness,
  };

  const reasons = [
    ...(bundle?.reasons ?? []),
    ...host.reasons.slice(0, 2),
    ...quality.issues.slice(0, 2),
  ];

  const rankingScore = bundle?.rankingScore ?? quality.qualityScore * 0.6 + host.hostTrustScore * 0.4 - riskPenalty * 0.15;

  return {
    rankingScore: Math.round(rankingScore * 10) / 10,
    factors,
    reasons,
    bundle,
  };
}
