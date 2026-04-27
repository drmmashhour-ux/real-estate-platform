import "server-only";

import type { BnhubListingForRanking } from "@repo/ai/bnhub-search";
import { generateSocialProof, type SocialProofListingInput } from "@/lib/ai/socialProof";
import type { UserProfile } from "@/lib/ai/userProfile";
import { isHighCityDemandForRanking } from "@/lib/market/demandActions";
import type { DemandHeatmapRow } from "@/lib/market/demandHeatmap";

/** Minimal heatmap row for demand signal (matches {@link getDemandHeatmap} output). */
export type DemandHeatmapRowLite = { city: string; demandScore: number };

export type RankSearchResultsArgs = {
  listings: BnhubListingForRanking[];
  query?: string | null;
  city?: string | null;
  userProfile: UserProfile | null;
  /** Injected in tests; default loads real heatmap via dynamic import (avoids loading DB in unit tests). */
  getHeatmap?: () => Promise<DemandHeatmapRowLite[]>;
};

export type BnhubListingWithRanking = BnhubListingForRanking & { rankingScore: number };

const norm = (s: string | undefined | null) => s?.trim().toLowerCase() ?? "";
const sameCity = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return x.length > 0 && y.length > 0 && x === y;
};

function textMatchScore(title: string | undefined, q: string | undefined): number {
  const t = norm(title);
  const query = (q ?? "").trim().toLowerCase();
  if (!query) return 0;
  if (!t) return 0;
  if (t.includes(query)) return 1;
  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) {
    if (t.includes(w)) return 0.5;
  }
  return 0;
}

function exactCityMatch(listingCity: string | undefined, searchCity: string | undefined | null): number {
  if (!searchCity?.trim() || !listingCity?.trim()) return 0;
  return sameCity(listingCity, searchCity) ? 1 : 0;
}

function preferredCityMatch(listingCity: string | undefined, preferred: string[] | undefined): number {
  if (!listingCity || !preferred?.length) return 0;
  const lc = norm(listingCity);
  for (const p of preferred) {
    if (lc === norm(p)) return 1;
  }
  return 0;
}

function priceMatchScore(
  nightPriceCents: number,
  profile: UserProfile | null
): number {
  if (profile == null) return 0.5;
  const { min, max } = profile.avgPriceRange;
  if (min <= 0 && max <= 0) return 0.5;
  const priceDollars = (nightPriceCents ?? 0) / 100;
  if (priceDollars <= 0) return 0.5;
  if (min > 0 && max > 0) {
    if (priceDollars >= min && priceDollars <= max) return 1;
    const lo = min * 0.8;
    const hi = max * 1.2;
    if (priceDollars >= lo && priceDollars <= hi) return 0.5;
    return 0;
  }
  if (min > 0) {
    if (priceDollars >= min) return 1;
    if (priceDollars >= min * 0.8) return 0.5;
    return 0;
  }
  if (max > 0) {
    if (priceDollars <= max) return 1;
    if (priceDollars <= max * 1.2) return 0.5;
    return 0;
  }
  return 0.5;
}

function rating01(listing: BnhubListingForRanking): number {
  const r = listing.bnhubListingRatingAverage;
  if (r == null || !Number.isFinite(r)) return 0;
  return Math.max(0, Math.min(1, r / 5));
}

function socialInputFromListing(l: BnhubListingForRanking): SocialProofListingInput {
  const views =
    l.bnhubListingViewCount != null && Number(l.bnhubListingViewCount) > 0
      ? Number(l.bnhubListingViewCount)
      : undefined;
  return {
    bookings: l._count?.bookings ?? l.bnhubListingCompletedStays ?? 0,
    views: views != null && Number(views) > 0 ? Number(views) : undefined,
    rating: l.bnhubListingRatingAverage ?? undefined,
  };
}

function freshnessBoost(listing: BnhubListingForRanking, nowMs: number): number {
  const c = listing.createdAt;
  if (c == null) return 0;
  const t = c instanceof Date ? c.getTime() : new Date(c).getTime();
  if (!Number.isFinite(t)) return 0;
  const days = (nowMs - t) / 864e5;
  if (days < 0) return 0.1;
  return Math.max(0, 0.2 * (1 - Math.min(1, days / 400)));
}

function buildDemandByCity(rows: DemandHeatmapRowLite[] | DemandHeatmapRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(norm(r.city), r.demandScore);
  }
  return m;
}

/**
 * Order 82 — score search rows for BNHub: text, city, price fit, rating, real social proof, demand, freshness.
 * **Does not** remove rows; only reorders. Same length as input.
 */
export async function rankSearchResults(args: RankSearchResultsArgs): Promise<BnhubListingWithRanking[]> {
  const { listings, query, city, userProfile } = args;
  const resolveHeatmap =
    args.getHeatmap ??
    (async () => {
      const { getDemandHeatmap } = await import("@/lib/market/demandHeatmap");
      return getDemandHeatmap();
    });
  if (listings.length <= 1) {
    return listings.map((l) => ({ ...l, rankingScore: 1 }));
  }

  const heatmap = await resolveHeatmap();
  const demandByCity = buildDemandByCity(heatmap);
  const now = Date.now();

  const withScores: BnhubListingWithRanking[] = listings.map((l) => {
    const sp = generateSocialProof(socialInputFromListing(l));
    const demandScore = demandByCity.get(norm(l.city)) ?? 0;
    const demandBoostExtra = isHighCityDemandForRanking(demandScore) ? demandScore * 0.1 : 0;
    const textMatch = textMatchScore(l.title, query ?? undefined);
    const exactC = exactCityMatch(l.city, city);
    const prefC = preferredCityMatch(l.city, userProfile?.preferredCities);
    const priceM = priceMatchScore(l.nightPriceCents, userProfile);
    const r01 = rating01(l);
    const fresh = freshnessBoost(l, now);

    const score =
      textMatch * 4 +
      exactC * 3 +
      prefC * 2 +
      priceM * 2 +
      r01 * 1.5 +
      sp.score * 2 +
      demandScore * 0.05 +
      demandBoostExtra +
      fresh;

    return { ...l, rankingScore: score };
  });

  return [...withScores].sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
    return a.id.localeCompare(b.id);
  });
}
