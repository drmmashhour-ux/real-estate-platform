import { trackEvent } from "@/lib/analytics/tracker";
import {
  buildUserProfile,
  effectivePreferenceWeight,
} from "@/lib/ai/preferenceProfile";
import { getWeight } from "@/lib/ab/learn";
import type { UserPrefRow } from "@/lib/ai/preferences";
import type { UserProfile } from "@/lib/ai/userProfile";
import { flags } from "@/lib/flags";
import {
  rankBySearchRelevance,
  computeSearchRelevance,
  normalize,
  type SearchableListing,
  type RankedSearchListing,
} from "@/lib/ai/searchRelevance";

const SEARCH_BOOST_KEY = "search_boost";

const MIN_PREFS_FOR_FULL_PERSONAL = 3;
const TOP_N_PREFS = 3;

type EffPref = UserPrefRow & { eff: number };

function toEffPref(p: UserPrefRow): EffPref {
  return { ...p, eff: effectivePreferenceWeight(p.weight, p.updatedAt) };
}

function topNKey(rows: EffPref[], k: string, n: number): EffPref[] {
  return rows.filter((r) => r.key === k).sort((a, b) => b.eff - a.eff).slice(0, n);
}

export type PersonalizationExplain = {
  city: number;
  propertyType: number;
  searchQuery: number;
  price: number;
};

/**
 * Scores a listing using top-N user prefs per key (recency-scaled), Order 82.1.
 */
export function applyPersonalization(
  listing: SearchableListing,
  prefs: UserPrefRow[],
  personalScale: number
): { boost: number; explain?: PersonalizationExplain } {
  if (prefs.length === 0) {
    return { boost: 0, explain: undefined };
  }
  const eff = prefs.map(toEffPref);
  const cities = topNKey(eff, "city", TOP_N_PREFS);
  const props = topNKey(eff, "propertyType", TOP_N_PREFS);
  const queries = topNKey(eff, "searchQuery", TOP_N_PREFS);
  const prices = topNKey(eff, "priceRange", TOP_N_PREFS);

  let boost = 0;
  const explain: PersonalizationExplain = { city: 0, propertyType: 0, searchQuery: 0, price: 0 };
  const nc = listing.city != null ? normalize(String(listing.city)) : "";
  const np = listing.propertyType != null ? normalize(String(listing.propertyType)) : "";
  const hay = normalize(
    `${listing.title ?? ""} ${listing.description ?? ""} ${listing.city ?? ""}`.replace(/\s+/g, " ")
  );

  for (const p of cities) {
    const pv = normalize(p.value);
    if (nc && nc === pv) {
      const add = 5 * p.eff * personalScale;
      boost += add;
      explain.city += add;
    }
  }
  for (const p of props) {
    const pv = normalize(p.value);
    if (np && np === pv) {
      const add = 3 * p.eff * personalScale;
      boost += add;
      explain.propertyType += add;
    }
  }
  for (const p of queries) {
    const pv = normalize(p.value);
    if (pv && hay.includes(pv)) {
      const add = 2 * p.eff * personalScale;
      boost += add;
      explain.searchQuery += add;
    }
  }
  for (const p of prices) {
    if (listing.price != null && listing.marketPrice != null && listing.marketPrice > 0) {
      const ratio = listing.price / listing.marketPrice;
      const band = ratio < 0.9 ? "low" : ratio > 1.1 ? "high" : "mid";
      if (band === p.value) {
        const add = 1.5 * p.eff * personalScale;
        boost += add;
        explain.price += add;
      }
    }
  }
  return { boost, explain };
}

/**
 * Ranks search results toward cities and price band inferred from `marketplace_events` (recommendation flag).
 */
export function profileMarketplaceBoost(
  listing: SearchableListing,
  profile: UserProfile | null | undefined
): number {
  if (!flags.RECOMMENDATIONS || !profile) return 0;
  if (profile.preferredCities.length === 0 && profile.avgPriceRange.max <= 0) return 0;

  let boost = 0;
  const nc = listing.city != null ? normalize(String(listing.city)) : "";
  for (const pc of profile.preferredCities) {
    if (nc && normalize(String(pc)) === nc) {
      boost += 8;
      break;
    }
  }
  const p = listing.price;
  const { min, max } = profile.avgPriceRange;
  if (p != null && max > 0 && p >= min && p <= max) {
    boost += 5;
  }
  return boost;
}

type RankOptions = {
  searchBoost: number;
  prefs: UserPrefRow[];
  profile?: UserProfile | null;
  /** Per-request personalization scale from pref count. */
  personalScale: number;
  debug?: boolean;
};

export function rankListingsWithPersonalization(
  query: string,
  listings: Array<SearchableListing & { id: string }>,
  opts: RankOptions
): { rows: RankedSearchListing[]; boostedResults: number } {
  const { debug } = opts;
  type Scored = SearchableListing & {
    id: string;
    _base: number;
    _personal: number;
    _market: number;
    total: number;
    personalizationExplain?: {
      city: number;
      propertyType: number;
      searchQuery: number;
      price: number;
    };
  };
  const withScores: Scored[] = listings.map((listing) => {
    const base = computeSearchRelevance(query, listing, { searchBoost: opts.searchBoost });
    const { boost: personal, explain } = applyPersonalization(listing, opts.prefs, opts.personalScale);
    const market = profileMarketplaceBoost(listing, opts.profile);
    const total = base + personal + market;
    const explainOut =
      debug && explain
        ? {
            city: Math.round(explain.city * 100) / 100,
            propertyType: Math.round(explain.propertyType * 100) / 100,
            searchQuery: Math.round(explain.searchQuery * 100) / 100,
            price: Math.round(explain.price * 100) / 100,
          }
        : undefined;
    return {
      ...listing,
      _base: base,
      _personal: personal,
      _market: market,
      total,
      personalizationExplain: explainOut,
    };
  });

  withScores.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b._base !== a._base) return b._base - a._base;
    return a.id.localeCompare(b.id);
  });

  const boostedResults = withScores.filter((l) => l._personal > 0.001).length;

  const rows: RankedSearchListing[] = withScores.map((l) => {
    const { _base, _personal, _market, total, ...rest } = l;
    return {
      ...rest,
      relevanceScore: total,
    } as RankedSearchListing;
  });

  return { rows, boostedResults };
}

export type RankPersonalizedSearchMeta = {
  prefCount: number;
  boostedResults: number;
  tookMs: number;
  personalized: boolean;
};

type RankSearchOptions = { profile?: UserProfile | null; debug?: boolean };

/**
 * End-to-end: learning weight + optional user taste. Without `userId`, matches anonymous {@link rankBySearchRelevance} + learning.
 */
export async function rankPersonalizedSearch(
  query: string,
  listings: Array<SearchableListing & { id: string }>,
  userId: string | null,
  getPrefs: (id: string) => Promise<UserPrefRow[]>,
  options?: RankSearchOptions
): Promise<{ items: RankedSearchListing[]; meta: RankPersonalizedSearchMeta }> {
  const t0 = Date.now();
  const w = await getWeight(SEARCH_BOOST_KEY, 1);
  if (!userId) {
    const items = rankBySearchRelevance(query, listings, { searchBoost: w });
    return {
      items,
      meta: {
        prefCount: 0,
        boostedResults: 0,
        tookMs: Date.now() - t0,
        personalized: false,
      },
    };
  }
  const prefs = await getPrefs(userId);
  const built = buildUserProfile(prefs);
  const prefCount = built.prefCount;
  const personalScale =
    prefCount === 0 ? 0 : Math.min(1, Math.max(0, prefCount / MIN_PREFS_FOR_FULL_PERSONAL));
  const showExplain =
    options?.debug === true || process.env.NODE_ENV !== "production";

  const { rows, boostedResults } = rankListingsWithPersonalization(query, listings, {
    searchBoost: w,
    prefs,
    profile: options?.profile,
    personalScale,
    debug: showExplain,
  });
  const tookMs = Date.now() - t0;
  if (rows.length > 0 && userId) {
    void trackEvent("personalization_applied", {
      userId,
      prefCount,
      boostedResults,
    });
  }
  return {
    items: rows,
    meta: { prefCount, boostedResults, tookMs, personalized: true },
  };
}

