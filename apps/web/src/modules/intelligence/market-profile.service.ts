import { prisma } from "@/lib/db";

export type MarketProfile = {
  city: string;
  activeListings: number;
  medianPriceCents?: number;
  priceSpreadCents?: number;
};

export async function buildMarketProfile(city: string): Promise<MarketProfile> {
  const rows = await prisma.fsboListing.findMany({
    where: {
      city: { equals: city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
    },
    select: { priceCents: true },
    take: 500,
  });
  const prices = rows.map((r) => r.priceCents).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)]! : undefined;
  const spread = prices.length ? prices[prices.length - 1]! - prices[0]! : undefined;
  return {
    city,
    activeListings: rows.length,
    medianPriceCents: median,
    priceSpreadCents: spread,
  };
}
