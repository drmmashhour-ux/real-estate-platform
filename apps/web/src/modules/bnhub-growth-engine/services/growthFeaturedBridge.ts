import { prisma } from "@/lib/db";

/** Growth engine internal homepage publishes (distinct from legacy marketing engine). */
export async function getGrowthFeaturedListingIds(limit = 24): Promise<string[]> {
  const rows = await prisma.bnhubGrowthDistribution.findMany({
    where: {
      distributionStatus: "PUBLISHED",
      connector: { connectorCode: "internal_homepage" },
    },
    select: { campaign: { select: { listingId: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return [...new Set(rows.map((r) => r.campaign.listingId))];
}

export async function getGrowthSearchBoostByListingId(): Promise<Map<string, number>> {
  const rows = await prisma.bnhubGrowthDistribution.findMany({
    where: {
      distributionStatus: "PUBLISHED",
      connector: { connectorCode: "internal_search_boost" },
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
