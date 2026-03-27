/**
 * Listing promotions – use existing PromotedListing and PromotionCampaign.
 */

import { prisma } from "@/lib/db";

export async function getPromotionsForListing(listingId: string) {
  return prisma.promotedListing.findMany({
    where: { listingId, status: "ACTIVE" },
    include: { campaign: true },
    orderBy: { endAt: "desc" },
  });
}

export async function createPromotion(params: {
  listingId: string;
  campaignId: string;
  startAt: Date;
  endAt: Date;
  placement: string;
  costCents?: number | null;
}) {
  const campaign = await prisma.promotionCampaign.findUnique({
    where: { id: params.campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  return prisma.promotedListing.create({
    data: {
      listingId: params.listingId,
      campaignId: params.campaignId,
      startAt: params.startAt,
      endAt: params.endAt,
      placement: params.placement as "FEATURED" | "SPONSORED" | "BOOST",
      costCents: params.costCents ?? undefined,
    },
    include: { campaign: true },
  });
}

export async function listActiveCampaigns(marketId?: string) {
  return prisma.promotionCampaign.findMany({
    where: {
      status: "ACTIVE",
      startAt: { lte: new Date() },
      endAt: { gte: new Date() },
      ...(marketId && { marketId }),
    },
    include: { market: true },
  });
}
