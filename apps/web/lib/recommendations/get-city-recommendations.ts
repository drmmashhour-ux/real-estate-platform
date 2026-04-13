import { ListingStatus } from "@prisma/client";
import type { CitySlug } from "@/lib/geo/city-search";
import { CITY_SLUGS, shortTermListingCityOrConditions } from "@/lib/geo/city-search";
import { prisma } from "@/lib/db";
import type { SimilarListingCard } from "./cards";
import { toSimilarListingCards } from "./cards";
import { diversifyByHost } from "./diversity";

/**
 * Popular stays in a marketing city page — diversified by host.
 */
export async function getStaysRecommendedInCity(slug: CitySlug, limit = 6): Promise<SimilarListingCard[]> {
  if (!CITY_SLUGS.includes(slug)) return [];

  const cityOr = shortTermListingCityOrConditions(slug);

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      OR: cityOr,
    },
    take: Math.min(36, limit * 6),
    orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
      ownerId: true,
      listingCode: true,
      title: true,
      city: true,
      country: true,
      beds: true,
      baths: true,
      nightPriceCents: true,
      propertyType: true,
      photos: true,
      listingPhotos: {
        take: 1,
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { url: true },
      },
    },
  });

  const diversified = diversifyByHost(rows, (r) => r.ownerId, {
    maxPerHostInPrefix: 2,
    prefixLength: Math.min(20, rows.length),
  }).slice(0, limit);

  return toSimilarListingCards(
    diversified.map((r) => ({
      id: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      country: r.country,
      beds: r.beds,
      baths: r.baths,
      nightPriceCents: r.nightPriceCents,
      propertyType: r.propertyType,
      photos: r.photos,
      listingPhotos: r.listingPhotos,
    }))
  );
}
