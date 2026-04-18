import { prisma } from "@/lib/db";
import { ListingAnalyticsKind } from "@prisma/client";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import { recommendFsboListingPrice } from "@/src/modules/pricing/pricing.engine";
import { revenueV4Flags, engineFlags } from "@/config/feature-flags";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * Refresh `FsboListingMetrics` from internal rows only (ranking, analytics, pricing engine).
 * Featured boost is capped when trust is low.
 */
export async function syncFsboListingMetrics(listingId: string): Promise<void> {
  if (!engineFlags.listingMetricsV1) return;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      trustScore: true,
      riskScore: true,
      images: true,
      description: true,
      featuredUntil: true,
      rankingTotalScoreCache: true,
    },
  });
  if (!listing) return;

  const [rankRow, analytics, pricingRec] = await Promise.all([
    prisma.listingRankingScore.findUnique({
      where: {
        listingType_listingId: {
          listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
          listingId: listingId,
        },
      },
      select: {
        totalScore: true,
        trustScore: true,
        qualityScore: true,
        engagementScore: true,
        conversionScore: true,
        priceCompetitivenessScore: true,
      },
    }),
    prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId } },
      select: { viewsTotal: true, saves: true, demandScore: true },
    }),
    revenueV4Flags.pricingEngineV1 ? recommendFsboListingPrice(listingId) : Promise.resolve(null),
  ]);

  const trustBase = listing.trustScore ?? 50;
  const risk = listing.riskScore ?? 0;
  const trustFallback = clamp100(trustBase - risk * 0.15);

  const photoCount = Array.isArray(listing.images) ? listing.images.length : 0;
  const descLen = listing.description?.length ?? 0;
  const qualityFallback = clamp100(
    Math.min(100, photoCount * 12 + Math.min(40, descLen / 120)),
  );

  const views = analytics?.viewsTotal ?? 0;
  const saves = analytics?.saves ?? 0;
  const engagementFallback = clamp100(Math.min(100, Math.log10(views + saves + 2) * 28));

  const rankingScore = clamp100(
    Number(rankRow?.totalScore ?? listing.rankingTotalScoreCache ?? 0) || 0,
  );
  const trustScore = rankRow?.trustScore != null ? clamp100(Number(rankRow.trustScore)) : trustFallback;
  const qualityScore = rankRow?.qualityScore != null ? clamp100(Number(rankRow.qualityScore)) : qualityFallback;
  const engagementScore =
    rankRow?.engagementScore != null ? clamp100(Number(rankRow.engagementScore)) : engagementFallback;
  const conversionScore =
    rankRow?.conversionScore != null
      ? clamp100(Number(rankRow.conversionScore))
      : clamp100(engagementFallback * 0.45 + trustScore * 0.35 + (saves > 0 ? 15 : 0));

  const priceCompetitivenessScore =
    rankRow?.priceCompetitivenessScore != null
      ? clamp100(Number(rankRow.priceCompetitivenessScore))
      : pricingRec
        ? clamp100(pricingRec.confidence * 70 + (pricingRec.lowConfidence ? 0 : 12))
        : clamp100(analytics?.demandScore ?? 35);

  const dealScore = pricingRec
    ? clamp100(pricingRec.confidence * 60 + (pricingRec.marketSampleSize > 2 ? 15 : 0))
    : clamp100(Number(analytics?.demandScore ?? 40));

  const now = Date.now();
  const featuredActive = listing.featuredUntil && listing.featuredUntil.getTime() > now;
  let featuredBoostScore = featuredActive ? 22 : 0;
  if (trustScore < 40) featuredBoostScore = Math.min(featuredBoostScore, 8);
  if (trustScore < 25) featuredBoostScore = Math.min(featuredBoostScore, 4);

  await prisma.fsboListingMetrics.upsert({
    where: { fsboListingId: listingId },
    create: {
      fsboListingId: listingId,
      rankingScore,
      trustScore,
      qualityScore,
      engagementScore,
      priceCompetitivenessScore,
      conversionScore,
      dealScore,
      priceSuggestedCents: pricingRec?.recommendedPriceCents ?? null,
      priceConfidence: pricingRec?.confidence ?? null,
      featuredBoostScore,
    },
    update: {
      rankingScore,
      trustScore,
      qualityScore,
      engagementScore,
      priceCompetitivenessScore,
      conversionScore,
      dealScore,
      priceSuggestedCents: pricingRec?.recommendedPriceCents ?? null,
      priceConfidence: pricingRec?.confidence ?? null,
      featuredBoostScore,
    },
  });
}
