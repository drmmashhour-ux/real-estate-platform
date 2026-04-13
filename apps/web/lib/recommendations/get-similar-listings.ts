import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { isListingAvailable } from "@/lib/bnhub/listings";
import type { SimilarListingCard } from "./cards";
import { computeHybridRecommendationScore, DEFAULT_HYBRID_WEIGHTS } from "./compute-recommendation-score";
import { diversifyByAreaAndType, diversifyByHost } from "./diversity";
import { toSimilarListingCards } from "./cards";
import {
  amenityJaccard,
  cityNeighborhoodScore,
  guestBedroomScore,
  listingQuality01,
  priceProximityScore,
  typeMatchScore,
} from "./similarity-features";
import { clamp01, normLog } from "@/lib/ranking/normalize-metrics";

function amenityStrings(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

function photoCount(photos: unknown, structured: number): number {
  if (structured > 0) return structured;
  if (Array.isArray(photos)) return photos.filter((x) => typeof x === "string").length;
  return 0;
}

export type GetSimilarBnhubParams = {
  listingId: string;
  city: string;
  country: string;
  nightPriceCents: number;
  propertyType?: string | null;
  /** When set, similarity uses guest / bedroom fit */
  maxGuests?: number;
  beds?: number;
  region?: string | null;
  amenities?: unknown;
  ownerId?: string;
  /** If set, filter out unavailable stays */
  checkIn?: string;
  checkOut?: string;
  limit?: number;
};

/**
 * Similar stays: scored on location, price, type, guests/beds, amenities, quality; hybrid blend + diversity.
 */
export async function getSimilarBnhubListings(params: GetSimilarBnhubParams): Promise<SimilarListingCard[]> {
  const margin = 0.38;
  const minP = Math.max(0, Math.floor(params.nightPriceCents * (1 - margin)));
  const maxP = Math.ceil(params.nightPriceCents * (1 + margin));
  const limit = params.limit ?? 6;
  const poolTake = Math.min(64, limit * 10);

  const anchorAmenities = amenityStrings(params.amenities);

  const baseWhere: Prisma.ShortTermListingWhereInput = {
    id: { not: params.listingId },
    listingStatus: "PUBLISHED",
    city: { equals: params.city.trim(), mode: "insensitive" },
    country: { equals: params.country.trim(), mode: "insensitive" },
    nightPriceCents: { gte: minP, lte: maxP },
  };

  let rows = await prisma.shortTermListing.findMany({
    where: baseWhere,
    take: poolTake,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ownerId: true,
      createdAt: true,
      listingCode: true,
      title: true,
      city: true,
      region: true,
      country: true,
      beds: true,
      baths: true,
      maxGuests: true,
      nightPriceCents: true,
      propertyType: true,
      photos: true,
      amenities: true,
      _count: { select: { reviews: true, listingPhotos: true } },
      listingPhotos: {
        take: 1,
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { url: true },
      },
    },
  });

  if (rows.length < 8) {
    const loose: Prisma.ShortTermListingWhereInput = {
      id: { not: params.listingId },
      listingStatus: "PUBLISHED",
      city: { equals: params.city.trim(), mode: "insensitive" },
      country: { equals: params.country.trim(), mode: "insensitive" },
    };
    const more = await prisma.shortTermListing.findMany({
      where: loose,
      take: poolTake,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
        listingCode: true,
        title: true,
        city: true,
        region: true,
        country: true,
        beds: true,
        baths: true,
        maxGuests: true,
        nightPriceCents: true,
        propertyType: true,
        photos: true,
        amenities: true,
        _count: { select: { reviews: true, listingPhotos: true } },
        listingPhotos: {
          take: 1,
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          select: { url: true },
        },
      },
    });
    const seen = new Set(rows.map((r) => r.id));
    for (const m of more) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      rows.push(m);
    }
  }

  const metrics = await prisma.listingSearchMetrics.findMany({
    where: { listingId: { in: rows.map((r) => r.id) } },
  });
  const metricsMap = new Map(metrics.map((m) => [m.listingId, m]));

  const anchorGuests = params.maxGuests ?? 2;
  const anchorBeds = params.beds ?? 1;

  type Scored = (typeof rows)[0] & { _hybrid: number };
  const scored: Scored[] = rows.map((r) => {
    const citySim = cityNeighborhoodScore(params.city, params.region, r.city, r.region);
    const priceSim = priceProximityScore(params.nightPriceCents, r.nightPriceCents, margin);
    const typeSim = typeMatchScore(params.propertyType, r.propertyType);
    const guestSim = guestBedroomScore(anchorGuests, r.maxGuests, anchorBeds, r.beds);
    const amSim = amenityJaccard(anchorAmenities, amenityStrings(r.amenities));
    const qual = listingQuality01({
      reviewCount: r._count.reviews,
      photoCount: photoCount(r.photos, r._count.listingPhotos),
    });

    const similarity_score =
      0.22 * citySim +
      0.22 * priceSim +
      0.14 * typeSim +
      0.14 * guestSim +
      0.14 * amSim +
      0.14 * qual;

    const m = metricsMap.get(r.id);
    const popularity_score =
      0.42 * normLog(m?.views30d ?? 0, 120) +
      0.28 * normLog(m?.bookings30d ?? 0, 20) +
      0.2 * (m?.ctr != null && m.ctr > 0 ? Math.min(1, m.ctr * 8) : 0.35) +
      0.1 * normLog((m?.bookings7d ?? 0) + 1, 8);

    const ageDays = (Date.now() - r.createdAt.getTime()) / 86400000;
    const newSupply = Math.exp(-Math.max(0, ageDays - 4) / 55);
    const underExposed = 1 / (1 + Math.log1p((m?.views30d ?? 0) / 36));
    const exploration_clean = clamp01(0.48 * newSupply + 0.52 * underExposed);

    const hybrid = computeHybridRecommendationScore(
      {
        similarity_score,
        preference_score: 0.55,
        popularity_score,
        quality_score: qual,
        exploration_score: exploration_clean,
      },
      DEFAULT_HYBRID_WEIGHTS
    );

    return { ...r, _hybrid: hybrid };
  });

  scored.sort((a, b) => b._hybrid - a._hybrid);

  let diversified = diversifyByHost(scored, (r) => r.ownerId, {
    maxPerHostInPrefix: 2,
    prefixLength: Math.min(24, scored.length),
  });
  diversified = diversifyByAreaAndType(diversified, (r) => `${r.city}|${r.region ?? ""}|${r.propertyType ?? ""}`, {
    maxPerBucketInPrefix: 3,
    prefixLength: Math.min(22, diversified.length),
  });

  const ownerEx = params.ownerId ? new Set([params.ownerId]) : new Set<string>();
  let picked = diversified.filter((r) => !ownerEx.has(r.ownerId));

  if (params.checkIn && params.checkOut) {
    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    if (!Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime()) && checkOut > checkIn) {
      const avail: typeof picked = [];
      for (const r of picked) {
        if (avail.length >= limit * 3) break;
        const ok = await isListingAvailable(r.id, checkIn, checkOut);
        if (ok) avail.push(r);
      }
      picked = avail;
    }
  }

  const top = picked.slice(0, limit);
  return toSimilarListingCards(
    top.map((r) => ({
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
