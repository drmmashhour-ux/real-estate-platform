import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type SimilarListingCard = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  country: string;
  beds: number;
  baths: number;
  nightPriceCents: number;
  propertyType: string | null;
  coverUrl: string | null;
};

/**
 * Rule-based "similar" stays: same city, overlapping price band, optional property type match.
 */
export async function getSimilarBnhubListings(params: {
  listingId: string;
  city: string;
  country: string;
  nightPriceCents: number;
  propertyType?: string | null;
  limit?: number;
}): Promise<SimilarListingCard[]> {
  const margin = 0.35;
  const minP = Math.max(0, Math.floor(params.nightPriceCents * (1 - margin)));
  const maxP = Math.ceil(params.nightPriceCents * (1 + margin));

  const where: Prisma.ShortTermListingWhereInput = {
    id: { not: params.listingId },
    listingStatus: "PUBLISHED",
    city: { equals: params.city.trim(), mode: "insensitive" },
    country: { equals: params.country.trim(), mode: "insensitive" },
    nightPriceCents: { gte: minP, lte: maxP },
  };

  const limit = params.limit ?? 6;
  const typeTrim = params.propertyType?.trim();
  if (typeTrim) {
    where.propertyType = { equals: typeTrim, mode: "insensitive" };
  }

  let rows = await prisma.shortTermListing.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
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

  if (rows.length < limit && typeTrim) {
    const whereLoose: Prisma.ShortTermListingWhereInput = {
      id: { not: params.listingId },
      listingStatus: "PUBLISHED",
      city: { equals: params.city.trim(), mode: "insensitive" },
      country: { equals: params.country.trim(), mode: "insensitive" },
      nightPriceCents: { gte: minP, lte: maxP },
    };
    const more = await prisma.shortTermListing.findMany({
      where: whereLoose,
      take: limit * 2,
      orderBy: { createdAt: "desc" },
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
    const seen = new Set(rows.map((r) => r.id));
    for (const m of more) {
      if (rows.length >= limit) break;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      rows.push(m);
    }
  }

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
