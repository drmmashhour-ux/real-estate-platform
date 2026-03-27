/**
 * Property / stay recommendations — rule-based, server-safe.
 * No user-facing "AI" labels; use "Similar properties" / "Recommended for you".
 */

import type { CitySlug } from "@/lib/geo/city-search";
import { CITY_SLUGS, getCityPageConfig, shortTermListingCityOrConditions } from "@/lib/geo/city-search";
import type { SimilarListingCard } from "@/lib/bnhub/similar-listings";
import { getSimilarBnhubListings } from "@/lib/bnhub/similar-listings";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type { SimilarListingCard };

const RECO_WINDOW_DAYS = 45;

/** Re-export for listing detail pages */
export { getSimilarBnhubListings };

async function toSimilarCardShape(
  rows: {
    id: string;
    listingCode: string;
    title: string;
    city: string;
    country: string;
    beds: number;
    baths: number;
    nightPriceCents: number;
    propertyType: string | null;
    photos: unknown;
    listingPhotos: { url: string }[];
  }[]
): Promise<SimilarListingCard[]> {
  return rows.map((l) => {
    const fromPhotos = l.listingPhotos[0]?.url;
    const legacy = Array.isArray(l.photos) && l.photos.length ? String((l.photos as string[])[0]) : null;
    return {
      id: l.id,
      listingCode: l.listingCode,
      title: l.title,
      city: l.city,
      country: l.country,
      beds: l.beds,
      baths: l.baths,
      nightPriceCents: l.nightPriceCents,
      propertyType: l.propertyType,
      coverUrl: fromPhotos ?? legacy,
    };
  });
}

/**
 * Popular stays in a marketing city (OR city match), balanced toward engagement.
 */
export async function getStaysRecommendedInCity(slug: CitySlug, limit = 6): Promise<SimilarListingCard[]> {
  if (!CITY_SLUGS.includes(slug)) return [];

  const cityOr: Prisma.ShortTermListingWhereInput[] = shortTermListingCityOrConditions(slug);

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "PUBLISHED",
      OR: cityOr,
    },
    take: Math.min(36, limit * 6),
    orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
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

  const sliced = rows.slice(0, limit);
  return toSimilarCardShape(sliced);
}

/**
 * Homepage / session: prefer recent viewed cities; else platform-wide recent + reviewed.
 */
export async function getStaysRecommendedForYou(userId: string | null, limit = 6): Promise<SimilarListingCard[]> {
  if (userId) {
    const since = new Date();
    since.setDate(since.getDate() - RECO_WINDOW_DAYS);

    const views = await prisma.aiUserActivityLog.findMany({
      where: { userId, eventType: "listing_view", createdAt: { gte: since } },
      select: { listingId: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const viewedIds = [...new Set(views.map((v) => v.listingId).filter(Boolean) as string[])];

    const cities = new Set<string>();
    if (viewedIds.length) {
      const meta = await prisma.shortTermListing.findMany({
        where: { id: { in: viewedIds.slice(0, 12) } },
        select: { city: true },
      });
      for (const m of meta) cities.add(m.city);
    }

    const cityList = [...cities].slice(0, 4);
    if (cityList.length) {
      const rows = await prisma.shortTermListing.findMany({
        where: {
          listingStatus: "PUBLISHED",
          city: { in: cityList },
          NOT: viewedIds.length ? { id: { in: viewedIds } } : undefined,
        },
        take: limit * 3,
        orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
        select: {
          id: true,
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
      if (rows.length >= 3) return toSimilarCardShape(rows.slice(0, limit));
    }
  }

  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED" },
    take: limit * 2,
    orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
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
  return toSimilarCardShape(rows.slice(0, limit));
}

/** Map slug to search query for links */
export function citySlugToSearchQuery(slug: CitySlug): string {
  return getCityPageConfig(slug).searchQuery;
}
