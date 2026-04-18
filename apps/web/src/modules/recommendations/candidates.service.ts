import { prisma } from "@/lib/db";
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { passesFsboTrustFloor } from "./filters.service";

type Row = {
  id: string;
  propertyType: string | null;
  rankingTotalScoreCache?: number;
};

/** Round-robin by property type (quality-sorted within each bucket). */
export function diversifyByPropertyType<T extends Row>(rows: T[], limit: number): T[] {
  const sorted = [...rows].sort(
    (a, b) => (b.rankingTotalScoreCache ?? 0) - (a.rankingTotalScoreCache ?? 0)
  );
  const buckets = new Map<string, T[]>();
  for (const r of sorted) {
    const k = (r.propertyType ?? "other").toLowerCase();
    const arr = buckets.get(k) ?? [];
    arr.push(r);
    buckets.set(k, arr);
  }
  let keys = [...buckets.keys()].sort();
  const out: T[] = [];
  while (out.length < limit && keys.length > 0) {
    const nextKeys: string[] = [];
    for (const k of keys) {
      const b = buckets.get(k);
      const item = b?.shift();
      if (item) {
        out.push(item);
        if (out.length >= limit) break;
      }
      if (b?.length) nextKeys.push(k);
    }
    keys = nextKeys;
  }
  return out;
}

export async function fetchSimilarFsbo(params: {
  city: string;
  excludeIds: string[];
  propertyType: string | null;
  priceCents: number;
  limit: number;
  /** When true (e.g. logged-in but sparse session), omit property-type filter for broader matches. */
  relaxedPropertyMatch?: boolean;
}) {
  const bandLow = Math.round(params.priceCents * 0.75);
  const bandHigh = Math.round(params.priceCents * 1.35);
  const typeFilter =
    !params.relaxedPropertyMatch && params.propertyType?.trim()
      ? [{ propertyType: { equals: params.propertyType.trim(), mode: "insensitive" as const } }]
      : [];
  const rows = await prisma.fsboListing.findMany({
    where: {
      AND: [
        buildFsboPublicVisibilityWhere(),
        { city: { equals: params.city, mode: "insensitive" } },
        { id: { notIn: params.excludeIds } },
        { priceCents: { gte: bandLow, lte: bandHigh } },
        ...typeFilter,
      ],
    },
    orderBy: [{ rankingTotalScoreCache: "desc" }, { updatedAt: "desc" }],
    take: params.limit * 2,
    select: {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      coverImage: true,
      images: true,
      propertyType: true,
      trustScore: true,
      moderationStatus: true,
      status: true,
      rankingTotalScoreCache: true,
    },
  });
  const filtered = rows.filter(passesFsboTrustFloor);
  return diversifyByPropertyType(filtered, params.limit);
}

export async function fetchTrendingFsbo(city: string | undefined, excludeIds: string[], limit: number) {
  const where = {
    AND: [
      buildFsboPublicVisibilityWhere(),
      ...(city ? [{ city: { equals: city, mode: "insensitive" as const } }] : []),
      { id: { notIn: excludeIds } },
    ],
  };
  const rows = await prisma.fsboListing.findMany({
    where,
    orderBy: [{ rankingTotalScoreCache: "desc" }],
    take: Math.min(60, limit * 5),
    select: {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      coverImage: true,
      images: true,
      propertyType: true,
      trustScore: true,
      moderationStatus: true,
      status: true,
      rankingTotalScoreCache: true,
    },
  });
  const filtered = rows.filter(passesFsboTrustFloor);
  return diversifyByPropertyType(filtered, limit);
}

/** Listings with recent seller activity (price/detail updates). Not every row is a price drop — copy must stay honest. */
export async function fetchRecentlyActiveFsbo(city: string | undefined, excludeIds: string[], limit: number, days = 10) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.fsboListing.findMany({
    where: {
      AND: [
        buildFsboPublicVisibilityWhere(),
        { updatedAt: { gte: since } },
        ...(city ? [{ city: { equals: city, mode: "insensitive" as const } }] : []),
        { id: { notIn: excludeIds } },
        /** Reduce low-signal clutter in feeds — still allows new listings with neutral cache. */
        { rankingTotalScoreCache: { gte: 8 } },
      ],
    },
    orderBy: [{ rankingTotalScoreCache: "desc" }, { updatedAt: "desc" }],
    take: Math.min(80, limit * 6),
    select: {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      coverImage: true,
      images: true,
      propertyType: true,
      trustScore: true,
      moderationStatus: true,
      status: true,
      rankingTotalScoreCache: true,
      updatedAt: true,
    },
  });
  const filtered = rows.filter(passesFsboTrustFloor);
  return diversifyByPropertyType(filtered, limit);
}
