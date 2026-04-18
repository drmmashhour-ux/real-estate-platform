import { prisma } from "@/lib/db";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";

export type ListingIntelProfile = {
  listingId: string;
  attractivenessScore: number;
  demandLevel: number;
  liquidityProxy: number;
  audienceMatch?: number;
};

export async function buildListingIntelProfile(listingId: string): Promise<ListingIntelProfile | null> {
  const [listing, rank] = await Promise.all([
    prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: {
        _count: { select: { buyerListingViews: true, leads: true, buyerSavedListings: true } },
      },
    }),
    prisma.listingRankingScore.findUnique({
      where: {
        listingType_listingId: { listingType: RANKING_LISTING_TYPE_REAL_ESTATE, listingId },
      },
    }),
  ]);
  if (!listing) return null;
  const views = listing._count.buyerListingViews;
  const leads = listing._count.leads;
  const saves = listing._count.buyerSavedListings;
  const demandLevel = Math.min(100, Math.round(Math.log1p(views) * 18 + leads * 4));
  const liquidityProxy = views > 0 ? Math.min(100, Math.round((leads / views) * 500)) : 0;
  const attractivenessScore = rank ? Math.round(rank.totalScore) : Math.min(100, demandLevel);
  return {
    listingId,
    attractivenessScore,
    demandLevel,
    liquidityProxy,
    audienceMatch: saves > 0 ? Math.min(100, saves * 10) : undefined,
  };
}
