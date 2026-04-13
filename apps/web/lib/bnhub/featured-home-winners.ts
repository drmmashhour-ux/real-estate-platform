import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildBnhubRankingInputs } from "@/src/modules/ranking/rankingService";
import { buildBnhubSignalBundle } from "@/src/modules/ranking/signalEngine";
import { augmentRankingSearchContextWithCityProfile } from "@/src/modules/cities/cityRankingBridge";
import { RANKING_LISTING_TYPE_BNHUB } from "@/src/modules/ranking/dataMap";
import type { RankingSearchContext } from "@/src/modules/ranking/types";
import {
  computeHomepageFeaturedScore,
  homepageLocationBucket,
  homepagePropertyBucket,
} from "@/lib/ranking/compute-homepage-score";
import { diversifyByAreaAndType, diversifyByHost } from "@/lib/ranking/diversity";

const listingInclude = {
  owner: { select: { id: true } },
  reviews: { select: { propertyRating: true }, take: 1 },
  _count: { select: { reviews: true, bookings: true } },
} as const;

/**
 * Listing ids to surface first on the marketing home — unified homepage ranking + diversity.
 * Falls back to metrics-only ordering when ranking inputs cannot be built.
 */
export async function getHomepageFeaturedWinnerIds(limit: number): Promise<string[]> {
  const take = Math.min(48, Math.max(12, Math.floor(limit * 4)));
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    include: listingInclude,
    orderBy: { updatedAt: "desc" },
    take,
  });
  if (rows.length === 0) return [];

  const inputs = await buildBnhubRankingInputs(
    rows.map((r) => ({ ...r, reviews: r.reviews.length ? r.reviews : [] }))
  );
  const ids = rows.map((r) => r.id);
  const metricsRows = await prisma.listingSearchMetrics.findMany({
    where: { listingId: { in: ids } },
  });
  const metricsMap = new Map(metricsRows.map((m) => [m.listingId, m]));

  const baseCtx: RankingSearchContext = {
    listingType: RANKING_LISTING_TYPE_BNHUB,
    availableForDates: true,
  };
  const ctx = await augmentRankingSearchContextWithCityProfile(baseCtx);

  const inputById = new Map(rows.map((row, i) => [row.id, inputs[i]!] as const));

  const scored = rows.map((row, i) => {
    const input = inputs[i]!;
    const signals = buildBnhubSignalBundle(input, ctx);
    const { score0to100 } = computeHomepageFeaturedScore(signals, input, metricsMap.get(row.id) ?? null);
    return { row, score: score0to100 };
  });
  scored.sort((a, b) => b.score - a.score);

  let ordered = scored.map((s) => s.row);
  ordered = diversifyByHost(ordered, (r) => r.ownerId, { maxPerHostInPrefix: 2, prefixLength: Math.min(24, ordered.length) });
  ordered = diversifyByAreaAndType(ordered, (r) => {
    const inp = inputById.get(r.id);
    if (!inp) return r.id;
    return `${homepageLocationBucket(inp)}|${homepagePropertyBucket(inp)}`;
  }, { maxPerBucketInPrefix: 2, prefixLength: Math.min(20, ordered.length) });

  return ordered.slice(0, limit).map((r) => r.id);
}
