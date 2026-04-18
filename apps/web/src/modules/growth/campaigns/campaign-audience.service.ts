import { prisma } from "@/lib/db";
import { GROWTH_V2 } from "../growth-v2.constants";

/**
 * High-view FSBO listings with almost no inquiries — sorted by views so the strongest signals surface first.
 * Trust floor + view/lead ratio reduce noisy “busy but junk” inventory.
 */
export async function findHighViewLowInquiryFsboSample(limit = 40): Promise<{ listingId: string; views: number }[]> {
  const minV = GROWTH_V2.HOST_CAMPAIGN_MIN_VIEWS;
  const maxLeads = GROWTH_V2.HOST_CAMPAIGN_MAX_LEADS;
  const minTrust = GROWTH_V2.MIN_TRUST_SCORE_HOST_CAMPAIGN_FSBO;

  const rows = await prisma.fsboListing.findMany({
    where: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      OR: [{ trustScore: null }, { trustScore: { gte: minTrust } }],
    },
    take: 220,
    select: {
      id: true,
      _count: { select: { buyerListingViews: true, leads: true } },
    },
  });

  return rows
    .filter((r) => r._count.buyerListingViews >= minV && r._count.leads <= maxLeads)
    .sort((a, b) => b._count.buyerListingViews - a._count.buyerListingViews)
    .slice(0, limit)
    .map((r) => ({ listingId: r.id, views: r._count.buyerListingViews }));
}
