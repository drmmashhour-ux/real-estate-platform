import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type CitySupply = { city: string; country: string; publishedListings: number };

const DEFAULT_MIN_LISTINGS = 8;

/** Cities with fewer than `minListings` published stays — prioritize host recruitment + ads/geo there. */
export async function getUnderSuppliedCities(minListings = DEFAULT_MIN_LISTINGS): Promise<CitySupply[]> {
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city", "country"],
    where: { listingStatus: ListingStatus.PUBLISHED },
    _count: { id: true },
  });

  return rows
    .filter((r) => r._count.id < minListings)
    .map((r) => ({
      city: r.city,
      country: r.country,
      publishedListings: r._count.id,
    }))
    .sort((a, b) => a.publishedListings - b.publishedListings);
}

/** Top cities by supply — use for guest demand campaigns and retargeting. */
export async function getTopSupplyCities(take = 15): Promise<CitySupply[]> {
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city", "country"],
    where: { listingStatus: ListingStatus.PUBLISHED },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });

  return rows.map((r) => ({
    city: r.city,
    country: r.country,
    publishedListings: r._count.id,
  }));
}
