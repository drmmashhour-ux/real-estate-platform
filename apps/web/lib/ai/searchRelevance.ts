/**
 * Heuristic “ML-ish” search relevance: tokenized text match + quality/trust + demand/price.
 * Not a learned model; `search_boost` from `learning_metrics` scales the final score.
 */

export type SearchableListing = {
  title?: string | null;
  description?: string | null;
  city?: string | null;
  propertyType?: string | null;
  /** Guest review average 1–5. */
  rating?: number | null;
  /** 0–100 composite (e.g. quality + discovery). */
  trustScore?: number | null;
  /** Count of countable stays in the last 30d (e.g. confirmed+). */
  bookingsLast30d?: number | null;
  /** Listing-level view signal (e.g. lifetime or windowed counter). */
  views?: number | null;
  /** Nightly (or list) price in major units for competitiveness vs. market anchor. */
  price?: number | null;
  /** Peer or market reference price in the same units as `price` (e.g. city mean nightly). */
  marketPrice?: number | null;
};

const SEARCH_BOOST_KEY = "search_boost";
const RELEVANCE_CACHE_TTL_MS = 10_000;
const RELEVANCE_CACHE_MAX = 100;

type CacheEntry<T> = { time: number; data: T };
const relevanceCache = new Map<string, CacheEntry<unknown>>();

function evictRelevanceIfNeeded(): void {
  if (relevanceCache.size < RELEVANCE_CACHE_MAX) return;
  const first = relevanceCache.keys().next().value;
  if (first) relevanceCache.delete(first);
}

/** Lowercase, strip accents, trim combining marks. */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokenize(q: string): string[] {
  return normalize(q).trim().split(/\s+/).filter(Boolean);
}

function emptyNorm(s: string | null | undefined): string {
  if (s == null) return "";
  return normalize(s);
}

export type ComputeRelevanceOptions = {
  /** From `getWeight("search_boost", 1)`; multiplies the full score. */
  searchBoost?: number;
};

export function computeSearchRelevance(
  query: string,
  listing: SearchableListing,
  options?: ComputeRelevanceOptions
): number {
  const tokens = tokenize(query);
  const hasQuery = tokens.length > 0;
  const searchBoost = options?.searchBoost ?? 1;

  let score = 0;

  if (hasQuery) {
    const nt = emptyNorm(listing.title ?? "");
    const nd = emptyNorm(listing.description ?? "");
    const nc = emptyNorm(listing.city ?? "");
    const np = emptyNorm(listing.propertyType ?? "");

    for (const t of tokens) {
      if (!t) continue;
      if (nt.includes(t)) score += 5;
      if (nd.includes(t)) score += 3;
      if (nc.includes(t)) score += 4;
      if (np.includes(t)) score += 2;
    }
  }

  const b30 = listing.bookingsLast30d;
  if (b30 != null && Number.isFinite(b30)) {
    score += Math.max(0, b30) * 2;
  }

  const v = listing.views;
  if (v != null && Number.isFinite(v)) {
    score += Math.max(0, v) * 0.05;
  }

  if (
    listing.price != null &&
    listing.marketPrice != null &&
    Number.isFinite(listing.price) &&
    Number.isFinite(listing.marketPrice) &&
    listing.marketPrice > 0
  ) {
    const ratio = listing.price / listing.marketPrice;
    if (ratio < 0.9) score += 10;
    else if (ratio > 1.2) score -= 5;
  }

  const rating = listing.rating;
  if (rating != null && Number.isFinite(rating) && rating >= 4.5) {
    score += 2;
  }

  const trust = listing.trustScore;
  if (trust != null && Number.isFinite(trust) && trust >= 80) {
    score += 2;
  }

  return score * searchBoost;
}

export type PersonalizationExplainSnapshot = {
  city: number;
  propertyType: number;
  searchQuery: number;
  price: number;
};

export type RankedSearchListing = SearchableListing & {
  relevanceScore: number;
  id: string;
  /** Order 82.1 — per-dimension contribution (debug / non-production or `?debug=1`). */
  personalizationExplain?: PersonalizationExplainSnapshot;
};

export type RankByRelevanceOptions = ComputeRelevanceOptions;

export function rankBySearchRelevance(
  query: string,
  listings: Array<SearchableListing & { id: string }>,
  options?: RankByRelevanceOptions
): RankedSearchListing[] {
  return listings
    .map((listing) => ({
      ...listing,
      relevanceScore: computeSearchRelevance(query, listing, options),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/** Fetches `search_boost` from learning metrics, then re-ranks. */
export async function rankBySearchRelevanceWithLearning(
  query: string,
  listings: Array<SearchableListing & { id: string }>
): Promise<RankedSearchListing[]> {
  const { getWeight } = await import("@/lib/ab/learn");
  const w = await getWeight(SEARCH_BOOST_KEY, 1);
  return rankBySearchRelevance(query, listings, { searchBoost: w });
}

/** @internal cache key: user (or anon) + normalized query + limit + schema version + debug variant. */
export function relevanceCacheKey(
  q: string,
  limit: number,
  userId: string | null,
  schema = 5,
  debug = false
): string {
  const who = userId ?? "anon";
  return `v${schema}::${who}::${normalize(q)}::${limit}::d${debug ? 1 : 0}`;
}

export function getCachedRelevance<T>(key: string, ttlMs = RELEVANCE_CACHE_TTL_MS): T | null {
  const hit = relevanceCache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.time < ttlMs) {
    return hit.data;
  }
  return null;
}

export function setCachedRelevance<T>(key: string, data: T): void {
  evictRelevanceIfNeeded();
  relevanceCache.set(key, { time: Date.now(), data });
}
