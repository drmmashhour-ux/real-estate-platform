import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { ListingAnalyticsKind } from "@prisma/client";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import { recommendFsboListingPrice } from "@/src/modules/pricing/pricing.engine";
import { toPricingEngineApiShape } from "@/src/modules/pricing/pricing.explainer";
import { revenueV4Flags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { logError } from "@/lib/logger";
import { syncFsboListingMetrics } from "@/src/modules/listings/syncFsboListingMetrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/dashboard/listings/[id] — per-listing host metrics + pricing insight when flag on.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isReasonableListingId(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      title: true,
      city: true,
      priceCents: true,
      status: true,
      featuredUntil: true,
      trustScore: true,
      rankingTotalScoreCache: true,
      rankingPerformanceBand: true,
    },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [views, saves, leads, rank, analytics, featured, pricingAdvice] = await Promise.all([
    prisma.buyerListingView.count({ where: { fsboListingId: id } }),
    prisma.buyerSavedListing.count({ where: { fsboListingId: id } }),
    prisma.fsboLead.count({ where: { listingId: id } }),
    prisma.listingRankingScore.findUnique({
      where: {
        listingType_listingId: {
          listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
          listingId: id,
        },
      },
      select: { totalScore: true, performanceBand: true, qualityScore: true },
    }),
    prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId: id } },
    }),
    prisma.featuredListing.findFirst({
      where: { listingKind: "fsbo", listingId: id, status: "active" },
      orderBy: { endAt: "desc" },
      select: { endAt: true, source: true },
    }),
    prisma.sellerPricingAdvice.findUnique({ where: { propertyId: id } }),
  ]);

  let pricing = null as ReturnType<typeof toPricingEngineApiShape> | null;
  if (revenueV4Flags.pricingEngineV1) {
    const rec = await recommendFsboListingPrice(id);
    if (rec) pricing = toPricingEngineApiShape(rec);
  }

  await syncFsboListingMetrics(id).catch(() => null);
  const decisionMetrics = await prisma.fsboListingMetrics.findUnique({
    where: { fsboListingId: id },
  });

  return Response.json({
    ok: true,
    listing: {
      ...listing,
      featuredUntil: listing.featuredUntil?.toISOString() ?? null,
    },
    metrics: {
      views: Math.max(views, analytics?.viewsTotal ?? 0),
      saves: Math.max(saves, analytics?.saves ?? 0),
      inquiries: leads,
    },
    ranking: rank ?? {
      totalScore: listing.rankingTotalScoreCache,
      performanceBand: listing.rankingPerformanceBand,
      qualityScore: null,
    },
    featuredActive: featured
      ? { endAt: featured.endAt.toISOString(), source: featured.source }
      : null,
    pricingInsight: pricing,
    pricingAdviceRow: pricingAdvice
      ? {
          pricePosition: pricingAdvice.pricePosition,
          confidenceLevel: pricingAdvice.confidenceLevel,
          updatedAt: pricingAdvice.updatedAt.toISOString(),
        }
      : null,
    decisionMetrics: decisionMetrics
      ? {
          rankingScore: decisionMetrics.rankingScore,
          trustScore: decisionMetrics.trustScore,
          qualityScore: decisionMetrics.qualityScore,
          engagementScore: decisionMetrics.engagementScore,
          priceCompetitivenessScore: decisionMetrics.priceCompetitivenessScore,
          conversionScore: decisionMetrics.conversionScore,
          dealScore: decisionMetrics.dealScore,
          priceSuggestedCents: decisionMetrics.priceSuggestedCents,
          priceConfidence: decisionMetrics.priceConfidence,
          featuredBoostScore: decisionMetrics.featuredBoostScore,
          updatedAt: decisionMetrics.updatedAt.toISOString(),
        }
      : null,
  });
  } catch (e) {
    logError("host_dashboard_listing_failed", { userId, listingId: id, err: e });
    return Response.json({ error: "Unable to load listing" }, { status: 500 });
  }
}
