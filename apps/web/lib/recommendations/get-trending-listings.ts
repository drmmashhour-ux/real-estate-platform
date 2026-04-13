import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normLog } from "@/lib/ranking/normalize-metrics";
import { computeHybridRecommendationScore, DEFAULT_HYBRID_WEIGHTS } from "./compute-recommendation-score";
import type { SimilarListingCard } from "./cards";
import { toSimilarListingCards } from "./cards";
import { diversifyByHost } from "./diversity";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Trending stays: views, bookings, CTR/conversion, freshness.
 */
export async function getTrendingBnhubListings(opts?: {
  city?: string;
  limit?: number;
  excludeIds?: string[];
}): Promise<SimilarListingCard[]> {
  const limit = Math.min(24, Math.max(4, opts?.limit ?? 8));
  const exclude = new Set(opts?.excludeIds ?? []);

  const metrics = await prisma.listingSearchMetrics.findMany({
    where: {
      listing: {
        listingStatus: ListingStatus.PUBLISHED,
        ...(opts?.city?.trim()
          ? { city: { contains: opts.city.trim(), mode: "insensitive" as const } }
          : {}),
      },
    },
    orderBy: [{ bookings30d: "desc" }, { views30d: "desc" }],
    take: 80,
    select: {
      listingId: true,
      views30d: true,
      bookings30d: true,
      bookings7d: true,
      ctr: true,
      conversionRate: true,
      listing: {
        select: {
          id: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
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
      },
    },
  });

  const scored = metrics
    .map((m) => {
      const r = m.listing;
      if (!r || exclude.has(r.id)) return null;
      const freshness =
        0.55 * Math.exp(-(Date.now() - r.createdAt.getTime()) / (86400000 * 90)) +
        0.45 * Math.exp(-(Date.now() - r.updatedAt.getTime()) / (86400000 * 45));
      const ctr01 = m.ctr != null ? Math.min(1, m.ctr * 6) : 0.35;
      const popularity =
        0.38 * normLog(m.views30d, 200) +
        0.32 * normLog(m.bookings30d, 25) +
        0.18 * normLog(m.bookings7d + 1, 12) +
        0.12 * (m.conversionRate != null ? clamp01(m.conversionRate) : ctr01);
      const hybrid = computeHybridRecommendationScore(
        {
          similarity_score: 0.55,
          preference_score: 0.45,
          popularity_score: popularity,
          quality_score: 0.62,
          exploration_score: clamp01(freshness),
        },
        DEFAULT_HYBRID_WEIGHTS
      );
      return { row: r, hybrid };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  scored.sort((a, b) => b.hybrid - a.hybrid);

  const diversified = diversifyByHost(
    scored.map((s) => s.row),
    (r) => r.ownerId,
    { maxPerHostInPrefix: 2, prefixLength: Math.min(20, scored.length) }
  ).slice(0, limit);

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
