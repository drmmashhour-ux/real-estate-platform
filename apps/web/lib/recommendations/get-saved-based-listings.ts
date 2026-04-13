import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SimilarListingCard } from "./cards";
import { toSimilarListingCards } from "./cards";
import { diversifyByHost } from "./diversity";
import { priceProximityScore, typeMatchScore } from "./similarity-features";

/**
 * Suggestions based on saved BNHub favorites — same city band + type affinity.
 */
export async function getSavedBasedBnhubListings(userId: string | null, limit = 8): Promise<SimilarListingCard[]> {
  if (!userId) return [];
  const take = Math.min(24, Math.max(4, limit));

  const favs = await prisma.bnhubGuestFavorite.findMany({
    where: { guestUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { listingId: true },
  });
  const favIds = favs.map((f) => f.listingId);
  if (favIds.length === 0) return [];

  const seeds = await prisma.shortTermListing.findMany({
    where: { id: { in: favIds }, listingStatus: ListingStatus.PUBLISHED },
    select: {
      city: true,
      country: true,
      nightPriceCents: true,
      propertyType: true,
    },
  });
  if (seeds.length === 0) return [];

  const medPrice = seeds.map((s) => s.nightPriceCents).sort((a, b) => a - b)[Math.floor(seeds.length / 2)]!;
  const city = seeds[0]!.city;
  const country = seeds[0]!.country;
  const type = seeds.find((s) => s.propertyType?.trim())?.propertyType ?? null;

  const minP = Math.floor(medPrice * 0.65);
  const maxP = Math.ceil(medPrice * 1.45);

  const candidates = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      id: { notIn: favIds },
      city: { equals: city, mode: "insensitive" },
      country: { equals: country, mode: "insensitive" },
      nightPriceCents: { gte: minP, lte: maxP },
    },
    take: take * 4,
    orderBy: { createdAt: "desc" },
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

  const scored = candidates
    .map((r) => {
      const typeS = typeMatchScore(type, r.propertyType);
      const priceS = priceProximityScore(medPrice, r.nightPriceCents, 0.45);
      const score = 0.55 * typeS + 0.45 * priceS;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  const diversified = diversifyByHost(
    scored.map((s) => s.r),
    (r) => r.ownerId,
    { maxPerHostInPrefix: 2, prefixLength: 16 }
  ).slice(0, take);

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
