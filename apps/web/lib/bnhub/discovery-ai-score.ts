import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  countListingAmenities,
  scoreListingForSearch,
  type ListingForMarketplaceRank,
  type ListingSearchRankContext,
} from "@/lib/bnhub/ranking/listing-ranking";

/** Deterministic 0–1 from id (stable across renders; not cryptographic). */
export function hashToUnit(id: string, salt: string): number {
  let h = 0;
  const s = `${salt}:${id}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
}

export type DiscoveryScoreContext = ListingSearchRankContext & {
  marketAvgNightCents: number;
  viewsTotal?: number;
};

/**
 * MVP 0–100 discovery score: marketplace rank + price vs local average + freshness + amenities + views.
 * When inputs are thin, blends in a deterministic band (60–95) so pins still differentiate.
 */
export function computeBnhubDiscoveryScore100(
  listing: ListingForMarketplaceRank & { id?: string; nightPriceCents?: number | null },
  ctx: DiscoveryScoreContext
): number {
  const base = scoreListingForSearch(listing, ctx).score * 100;

  let priceAdj = 0;
  if (ctx.marketAvgNightCents > 0 && listing.nightPriceCents != null) {
    const ratio = listing.nightPriceCents / ctx.marketAvgNightCents;
    if (ratio > 0 && ratio <= 0.88) priceAdj = 7;
    else if (ratio > 1.15) priceAdj = -5;
  }

  const created = listing.createdAt ? new Date(listing.createdAt).getTime() : NaN;
  const ageDays = Number.isFinite(created) ? (Date.now() - created) / 86400000 : 365;
  const freshAdj = ageDays < 14 ? 4 : ageDays < 60 ? 2 : ageDays < 180 ? 0 : -2;

  const amenities = countListingAmenities(listing.amenities);
  const featAdj = Math.min(5, amenities * 0.35);

  const views = ctx.viewsTotal ?? 0;
  const viewAdj = Math.min(7, Math.log1p(views) * 1.1);

  let s = base + priceAdj + freshAdj + featAdj + viewAdj;
  if (!Number.isFinite(s) || s < 40) {
    s = 60 + hashToUnit(String(listing.id ?? "x"), "disc") * 35;
  }
  s = Math.max(55, Math.min(98, s));
  return Math.round(s);
}

/** Normalize intelligence `aiScore` (0–1) or legacy 0–100 to integer 0–100. */
export function normalizeAiScoreTo100(raw: number | undefined | null): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  if (raw <= 1.5) return Math.round(Math.min(100, Math.max(0, raw * 100)));
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Ensures every BNHUB search row has integer `aiScore` 0–100 for map pins, badges, and sorting.
 * Preserves `aiBreakdown` / `aiLabels` from `applyAiSearchRankingToBnhubResults` when present.
 */
export async function attachIntegerAiScoresToBnhubSearchResults<
  T extends {
    id: string;
    nightPriceCents: number;
    createdAt: Date;
    amenities?: unknown;
    aiScore?: number;
  },
>(listings: T[], ctx: ListingSearchRankContext): Promise<Array<T & { aiScore: number }>> {
  if (listings.length === 0) return [];

  const ids = listings.map((l) => l.id);
  const analytics = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: ids } },
    select: { listingId: true, viewsTotal: true },
  });
  const viewsMap = new Map(analytics.map((a) => [a.listingId, a.viewsTotal]));

  const marketAvg =
    listings.reduce((s, l) => s + (l.nightPriceCents ?? 0), 0) / Math.max(1, listings.length);

  return listings.map((l) => {
    const normalized = normalizeAiScoreTo100(l.aiScore);
    if (normalized != null) {
      return { ...l, aiScore: normalized };
    }
    const score = computeBnhubDiscoveryScore100(l as ListingForMarketplaceRank, {
      ...ctx,
      marketAvgNightCents: marketAvg,
      viewsTotal: viewsMap.get(l.id),
    });
    return { ...l, aiScore: score };
  });
}
