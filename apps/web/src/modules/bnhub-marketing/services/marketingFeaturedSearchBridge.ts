import { prisma } from "@/lib/db";

/** Listing IDs with active internal homepage publish (marketing engine). */
export async function getMarketingFeaturedListingIds(limit = 24): Promise<string[]> {
  const rows = await prisma.bnhubCampaignDistribution.findMany({
    where: {
      distributionStatus: "PUBLISHED",
      channel: { code: "internal_homepage", enabled: true },
    },
    select: { campaign: { select: { listingId: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return [...new Set(rows.map((r) => r.campaign.listingId))];
}

/** Capped internal search boost points by listing id (max 12 per listing from engine). */
export async function getMarketingSearchBoostByListingId(): Promise<Map<string, number>> {
  const rows = await prisma.bnhubCampaignDistribution.findMany({
    where: {
      distributionStatus: "PUBLISHED",
      channel: { code: "internal_search_boost", enabled: true },
    },
    select: {
      campaign: { select: { listingId: true } },
      payloadJson: true,
    },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const lid = r.campaign.listingId;
    const raw = (r.payloadJson as { boostPoints?: number } | null)?.boostPoints ?? 8;
    const pts = Math.min(12, Math.max(0, Number(raw) || 0));
    map.set(lid, Math.max(map.get(lid) ?? 0, pts));
  }
  return map;
}
