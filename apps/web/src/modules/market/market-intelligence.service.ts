import { prisma } from "@/lib/db";
import { marketplaceAiV5Flags } from "@/config/feature-flags";

export type HotZone = {
  city: string;
  activeListings: number;
  demandProxy: number;
};

export type MarketIntelligenceSnapshot = {
  hotZones: HotZone[];
  notes: string[];
  confidence: number;
};

/**
 * City-level supply proxy — not a licensed market appraisal.
 */
export async function getMarketIntelligenceSnapshot(limitCities = 12): Promise<MarketIntelligenceSnapshot | null> {
  if (!marketplaceAiV5Flags.marketIntelligenceV1) return null;

  const grouped = await prisma.fsboListing.groupBy({
    by: ["city"],
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: limitCities,
  });

  const leadWindow = await prisma.fsboLead.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });

  const hotZones: HotZone[] = grouped.map((g) => ({
    city: g.city,
    activeListings: g._count._all,
    demandProxy: Math.min(
      100,
      Math.round(18 + Math.min(40, g._count._all / 2) + Math.min(25, leadWindow / Math.max(1, grouped.length))),
    ),
  }));

  return {
    hotZones,
    notes: [
      "Demand proxy uses 30d lead volume / city count — illustrative.",
      "Investment advice requires a registered professional — platform shows inventory stats only.",
    ],
    confidence: 0.42,
  };
}
