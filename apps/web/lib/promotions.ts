/**
 * Promotion and Marketplace Monetization Layer – featured listings, sponsored placement, boosts.
 * Connects search, listings, billing, and admin.
 */
import { prisma } from "@/lib/db";
import type { PromotionPlacement, PromotionCampaignStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { recordRevenueEntry } from "@/lib/revenue-intelligence";

export type { PromotionPlacement, PromotionCampaignStatus };

/** Get active promotion campaigns (for admin and listing promotion UI). */
export async function getPromotionCampaigns(params?: {
  marketId?: string;
  status?: PromotionCampaignStatus;
  limit?: number;
}) {
  const where: Prisma.PromotionCampaignWhereInput = {};
  if (params?.marketId) where.marketId = params.marketId;
  if (params?.status) where.status = params.status;
  return prisma.promotionCampaign.findMany({
    where,
    include: { market: { select: { code: true, name: true } }, _count: { select: { promotions: true } } },
    orderBy: { startAt: "desc" },
    take: params?.limit ?? 50,
  });
}

/** Create promotion campaign. */
export async function createPromotionCampaign(params: {
  name: string;
  campaignType: string;
  marketId?: string;
  budgetCents?: number;
  startAt: Date;
  endAt: Date;
  createdBy?: string;
}) {
  return prisma.promotionCampaign.create({
    data: {
      name: params.name,
      campaignType: params.campaignType,
      marketId: params.marketId,
      budgetCents: params.budgetCents,
      startAt: params.startAt,
      endAt: params.endAt,
      status: "DRAFT",
      createdBy: params.createdBy,
    },
  });
}

/** Promote a listing (add to campaign). */
export async function promoteListing(params: {
  listingId: string;
  campaignId: string;
  startAt: Date;
  endAt: Date;
  placement: PromotionPlacement;
  costCents?: number;
}) {
  const campaign = await prisma.promotionCampaign.findUniqueOrThrow({
    where: { id: params.campaignId },
  });
  if (campaign.status !== "ACTIVE" && campaign.status !== "DRAFT")
    throw new Error("Campaign is not active");
  const now = new Date();
  const promotion = await prisma.promotedListing.create({
    data: {
      listingId: params.listingId,
      campaignId: params.campaignId,
      startAt: params.startAt,
      endAt: params.endAt,
      placement: params.placement,
      costCents: params.costCents,
      status: now >= params.startAt && now <= params.endAt ? "ACTIVE" : "ACTIVE",
    },
  });
  if (params.costCents && params.costCents > 0) {
    await recordRevenueEntry({
      type: "PROMOTION",
      entityType: "PROMOTED_LISTING",
      entityId: promotion.id,
      amountCents: params.costCents,
      marketId: campaign.marketId ?? undefined,
      module: "BNHUB",
      metadata: { listingId: params.listingId, campaignId: params.campaignId },
    });
  }
  return promotion;
}

/** Get active promoted listing IDs for a given placement and optional market (for search ranking). */
export async function getActivePromotedListingIds(params: {
  placement: PromotionPlacement;
  marketId?: string;
  limit?: number;
}): Promise<string[]> {
  const now = new Date();
  const where: Prisma.PromotedListingWhereInput = {
    status: "ACTIVE",
    startAt: { lte: now },
    endAt: { gte: now },
    placement: params.placement,
  };
  if (params.marketId) {
    where.campaign = { marketId: params.marketId, status: "ACTIVE" };
  } else {
    where.campaign = { status: "ACTIVE" };
  }
  const rows = await prisma.promotedListing.findMany({
    where,
    select: { listingId: true },
    take: params.limit ?? 100,
  });
  return rows.map((r) => r.listingId);
}

/** Get promotion info for a single listing (for transparent "Sponsored" label in UI). */
export async function getListingPromotion(listingId: string): Promise<{
  placement: PromotionPlacement;
  campaignName: string;
  endAt: Date;
} | null> {
  const now = new Date();
  const p = await prisma.promotedListing.findFirst({
    where: {
      listingId,
      status: "ACTIVE",
      startAt: { lte: now },
      endAt: { gte: now },
    },
    include: { campaign: { select: { name: true } } },
  });
  if (!p) return null;
  return {
    placement: p.placement,
    campaignName: p.campaign.name,
    endAt: p.endAt,
  };
}
