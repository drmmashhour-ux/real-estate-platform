import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";
import { generateSmartPrice } from "./smart-pricing";

export type HostInsights = {
  cities: string[];
  avgPriceInAreaCents: number | null;
  bookingTrend: { month: string; count: number }[];
  suggestedPriceCents: number | null;
  primaryListingId: string | null;
};

/**
 * Aggregate market and booking trends for the host dashboard (first listing drives smart price).
 */
export async function getHostInsights(ownerId: string): Promise<HostInsights> {
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId },
    select: { id: true, city: true, nightPriceCents: true, listingStatus: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (listings.length === 0) {
    return {
      cities: [],
      avgPriceInAreaCents: null,
      bookingTrend: [],
      suggestedPriceCents: null,
      primaryListingId: null,
    };
  }

  const cities = [...new Set(listings.map((l) => l.city))];
  const primaryCity = listings[0].city;
  const primaryListingId = listings.find((l) => l.listingStatus === ListingStatus.PUBLISHED)?.id ?? listings[0].id;

  const agg = await prisma.shortTermListing.aggregate({
    where: { city: primaryCity, listingStatus: ListingStatus.PUBLISHED },
    _avg: { nightPriceCents: true },
  });
  const avgPriceInAreaCents =
    agg._avg.nightPriceCents != null ? Math.round(agg._avg.nightPriceCents) : null;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await prisma.booking.findMany({
    where: {
      listing: { ownerId },
      createdAt: { gte: sixMonthsAgo },
    },
    select: { createdAt: true },
  });

  const byMonth = new Map<string, number>();
  for (const b of bookings) {
    const d = b.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const bookingTrend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  let suggestedPriceCents: number | null = null;
  try {
    const smart = await generateSmartPrice(primaryListingId);
    suggestedPriceCents = smart.recommendedPriceCents;
  } catch {
    suggestedPriceCents = null;
  }

  return {
    cities,
    avgPriceInAreaCents,
    bookingTrend,
    suggestedPriceCents,
    primaryListingId,
  };
}
