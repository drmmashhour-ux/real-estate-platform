import { ListingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildUserSignals } from "@/lib/ai/core/buildUserSignals";
import { normLog } from "@/lib/ranking/normalize-metrics";
import { computeHybridRecommendationScore, DEFAULT_HYBRID_WEIGHTS } from "./compute-recommendation-score";
import type { SimilarListingCard } from "./cards";
import { toSimilarListingCards } from "./cards";
import { diversifyByHost } from "./diversity";
import {
  cityNeighborhoodScore,
  priceProximityScore,
  typeMatchScore,
} from "./similarity-features";

const RECO_WINDOW_DAYS = 45;

function preferenceMatch01(
  row: {
    city: string;
    region: string | null;
    nightPriceCents: number;
    propertyType: string | null;
    maxGuests: number;
  },
  prefs: {
    cities: string[];
    types: string[];
    priceMin: number | null;
    priceMax: number | null;
    guests: number | null;
  }
): number {
  let s = 0.45;
  const cityHit = prefs.cities.some(
    (c) =>
      row.city.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(row.city.toLowerCase())
  );
  if (cityHit) s += 0.28;
  else if (prefs.cities.length) s += 0.08 * cityNeighborhoodScore(prefs.cities[0] ?? "", null, row.city, row.region);

  const typeHit = prefs.types.some(
    (t) =>
      row.propertyType &&
      (row.propertyType.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(row.propertyType.toLowerCase()))
  );
  if (typeHit) s += 0.12;
  else if (prefs.types.length) s += 0.06 * typeMatchScore(prefs.types[0] ?? null, row.propertyType);

  const night = row.nightPriceCents / 100;
  if (prefs.priceMin != null && prefs.priceMax != null && prefs.priceMax > prefs.priceMin) {
    if (night >= prefs.priceMin && night <= prefs.priceMax) s += 0.12;
    else s += 0.04 * priceProximityScore(Math.round(((prefs.priceMin + prefs.priceMax) / 2) * 100), row.nightPriceCents, 0.55);
  }

  if (prefs.guests != null && prefs.guests > 0) {
    s += row.maxGuests >= prefs.guests ? 0.08 : 0.03;
  }

  return Math.min(1, s);
}

/**
 * Recommended for you — merges `UserSearchProfile` / intelligence profile with hybrid scoring.
 */
export async function getPersonalizedBnhubListings(userId: string | null, limit = 8): Promise<SimilarListingCard[]> {
  const take = Math.min(24, Math.max(4, limit));
  if (!userId) {
    const rows = await prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      take: take * 2,
      orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
      select: cardSelect(),
    });
    return toSimilarListingCards(rows.slice(0, take));
  }

  const userSignals = await buildUserSignals(userId);
  const since = new Date();
  since.setDate(since.getDate() - RECO_WINDOW_DAYS);

  const views = await prisma.searchEvent.findMany({
    where: { userId, listingId: { not: null }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { listingId: true },
  });
  const viewedIds = [...new Set(views.map((v) => v.listingId).filter((x): x is string => Boolean(x)))];

  const prefs = {
    cities: userSignals?.preferredCities ?? [],
    types: userSignals?.preferredTypes ?? [],
    priceMin: userSignals?.preferredPriceMin ?? null,
    priceMax: userSignals?.preferredPriceMax ?? null,
    guests: userSignals?.preferredGuests ?? null,
  };

  const cityFilter =
    prefs.cities.length > 0
      ? {
          OR: prefs.cities.slice(0, 5).map((c) => ({
            city: { contains: c, mode: "insensitive" as const },
          })),
        }
      : {};

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      ...(Object.keys(cityFilter).length ? cityFilter : {}),
      ...(viewedIds.length ? { id: { notIn: viewedIds } } : {}),
    },
    take: take * 5,
    orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
    select: cardSelect(),
  });

  const metrics = await prisma.listingSearchMetrics.findMany({
    where: { listingId: { in: rows.map((r) => r.id) } },
  });
  const mm = new Map(metrics.map((m) => [m.listingId, m]));

  const scored = rows.map((r) => {
    const pref = preferenceMatch01(
      {
        city: r.city,
        region: r.region,
        nightPriceCents: r.nightPriceCents,
        propertyType: r.propertyType,
        maxGuests: r.maxGuests,
      },
      prefs
    );
    const m = mm.get(r.id);
    const ctr01 = m?.ctr != null ? Math.min(1, m.ctr * 6) : 0.35;
    const pop =
      0.5 * normLog(m?.views30d ?? 0, 150) + 0.35 * normLog(m?.bookings30d ?? 0, 20) + 0.15 * ctr01;
    const hybrid = computeHybridRecommendationScore(
      {
        similarity_score: pref,
        preference_score: pref,
        popularity_score: pop,
        quality_score: 0.55,
        exploration_score: Math.exp(-(Date.now() - r.createdAt.getTime()) / (86400000 * 120)),
      },
      DEFAULT_HYBRID_WEIGHTS
    );
    return { r, hybrid };
  });

  scored.sort((a, b) => b.hybrid - a.hybrid);
  const diversified = diversifyByHost(
    scored.map((s) => s.r),
    (r) => r.ownerId,
    { maxPerHostInPrefix: 2, prefixLength: 20 }
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

function cardSelect(): Prisma.ShortTermListingSelect {
  return {
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
    listingPhotos: {
      take: 1,
      orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      select: { url: true },
    },
  };
}
