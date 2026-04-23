/**
 * Search ranking for BNHUB: marketplace quality / performance / availability / freshness,
 * plus lightweight labels for UI. Core scoring lives in `lib/bnhub/ranking/listing-ranking.ts`.
 */

import {
  explainListingScore,
  scoreListingForSearch,
  type ListingForMarketplaceRank,
  type ListingSearchScoreResult,
} from "@/lib/bnhub/ranking/listing-ranking";
import { memoryListingAffinity01, type MemoryRankHint } from "@/lib/marketplace-memory/memory-ranking-hint";

export type BnhubSearchFilters = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
};

export type BnhubSearchUserContext = {
  /** Optional: preferred price range for personalization */
  preferredMaxPrice?: number;
  /** Bounded memory hint from marketplace memory (session + long-term summaries). */
  memoryRankHint?: MemoryRankHint | null;
};

/** Listing shape expected by rankListings (matches search API response). */
export type BnhubListingForRanking = {
  id: string;
  title?: string;
  listingCode?: string | null;
  city?: string;
  region?: string | null;
  nightPriceCents: number;
  maxGuests?: number;
  beds?: number;
  baths?: number;
  propertyType?: string | null;
  roomType?: string | null;
  photos?: unknown;
  description?: string | null;
  amenities?: unknown;
  listingStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  verificationStatus?: string;
  bnhubListingRatingAverage?: number | null;
  bnhubListingReviewCount?: number | null;
  bnhubListingCompletedStays?: number | null;
  _count?: { reviews?: number; bookings?: number };
  reviews?: { propertyRating?: number }[];
  /** When owner host performance is joined — small ranking nudge only */
  hostReputationScore?: number | null;
  /** From `attachReviewAggregatesForSearch` — blends into marketplace quality in ranking. */
  cachedListingQuality01?: number | null;
  /** Optional pill for search UI when quality thresholds are met. */
  qualityBadgeLabel?: string | null;
};

export type BnhubListingLabel = "Best Match" | "Great Price" | "High Demand";

export type RankedBnhubListing<T extends BnhubListingForRanking = BnhubListingForRanking> = T & {
  _aiScore: number;
  _aiLabels: BnhubListingLabel[];
  /** Present only when `rankListings` is called with `rankingDebug: true` (server env + query). */
  _marketplaceRankDebug?: {
    score: number;
    components: ListingSearchScoreResult["components"];
    weightsEffective: ListingSearchScoreResult["weightsEffective"];
    explain: string[];
  };
};

const LABEL_BEST_MATCH: BnhubListingLabel = "Best Match";
const LABEL_GREAT_PRICE: BnhubListingLabel = "Great Price";
const LABEL_HIGH_DEMAND: BnhubListingLabel = "High Demand";

function normalizeLocation(s: string | undefined): string {
  if (!s || typeof s !== "string") return "";
  return s.trim().toLowerCase();
}

function locationMatches(
  listingCity: string | undefined,
  filterLocation: string | undefined
): "exact" | "partial" | "none" {
  if (!filterLocation?.trim()) return "partial";
  const a = normalizeLocation(listingCity);
  const b = normalizeLocation(filterLocation);
  if (!a) return "none";
  if (a === b) return "exact";
  if (a.includes(b) || b.includes(a)) return "partial";
  return "none";
}

function guestMatch(listingGuests: number | undefined, filterGuests: number | undefined): number {
  if (filterGuests == null || filterGuests <= 0) return 1;
  const max = listingGuests ?? 0;
  if (max <= 0) return 0.5;
  if (max === filterGuests) return 1;
  if (max >= filterGuests) return 0.85;
  return 0.2;
}

function priceVsMarketRatio(listingPriceCents: number, marketAvgCents: number): number {
  if (marketAvgCents <= 0) return 1;
  return listingPriceCents / marketAvgCents;
}

/**
 * UI labels from marketplace explainers + light price/location/guest heuristics (no extra DB fields).
 */
function deriveLabels(
  listing: BnhubListingForRanking,
  filters: BnhubSearchFilters,
  marketplaceScore01: number,
  marketAvgCents: number
): BnhubListingLabel[] {
  const ctxRank: ListingForMarketplaceRank = listing;
  const explains = explainListingScore(ctxRank, {
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
  });
  const labels: BnhubListingLabel[] = [];

  const exactLocation = locationMatches(listing.city, filters.location) === "exact";
  const hasDates = Boolean(filters.checkIn && filters.checkOut);
  const guestFit = guestMatch(listing.maxGuests, filters.guests) >= 0.85;
  if (exactLocation && hasDates && guestFit && marketplaceScore01 >= 0.52) labels.push(LABEL_BEST_MATCH);

  const ratio = priceVsMarketRatio(listing.nightPriceCents ?? 0, marketAvgCents);
  if (ratio > 0 && ratio <= 0.92) labels.push(LABEL_GREAT_PRICE);

  if (
    explains.some((e) => e.includes("strong guest feedback")) ||
    (listing._count?.bookings ?? 0) >= 5 ||
    (listing._count?.reviews ?? 0) >= 5
  ) {
    labels.push(LABEL_HIGH_DEMAND);
  }

  return [...new Set(labels)];
}

export type RankListingsOptions = {
  /** When true, attaches `_marketplaceRankDebug` (internal — enable via env + query on API). */
  rankingDebug?: boolean;
};

/**
 * Rank listings by marketplace score and attach labels.
 * After filtering, pass the result here; this sorts by score DESC and adds
 * `_aiScore` (0–100 scale) and `_aiLabels`.
 */
export function rankListings<T extends BnhubListingForRanking>(
  listings: T[],
  filters: BnhubSearchFilters,
  userContext?: BnhubSearchUserContext,
  options?: RankListingsOptions
): RankedBnhubListing<T>[] {
  if (listings.length === 0) return [];

  const marketAvgCents =
    listings.reduce((sum, l) => sum + (l.nightPriceCents ?? 0), 0) / listings.length;

  const rankCtx = {
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
  };

  const memoryHint = userContext?.memoryRankHint ?? null;

  const scored: RankedBnhubListing<T>[] = listings.map((listing) => {
    const ctxListing = listing as ListingForMarketplaceRank;
    const result = scoreListingForSearch(ctxListing, rankCtx);
    const score01 = result.score;
    const labels = deriveLabels(listing, filters, score01, marketAvgCents);
    const tieGuest = guestMatch(listing.maxGuests, filters.guests) * 0.02;
    const tiePrice = 1 - Math.min(1, priceVsMarketRatio(listing.nightPriceCents ?? 0, marketAvgCents)) * 0.01;
    /** Max +3 points on the 0–100 display scale — assistive only. */
    const memNudge =
      memoryHint != null ? Math.min(3, memoryListingAffinity01(listing, memoryHint) * 3) : 0;
    const displayScore = Math.round((score01 * 100 + tieGuest + tiePrice + memNudge) * 100) / 100;

    const row: RankedBnhubListing<T> = {
      ...listing,
      _aiScore: displayScore,
      _aiLabels: labels,
    };

    if (options?.rankingDebug) {
      row._marketplaceRankDebug = {
        score: score01,
        components: result.components,
        weightsEffective: result.weightsEffective,
        explain: explainListingScore(ctxListing, rankCtx),
      };
    }

    return row;
  });

  scored.sort((a, b) => {
    const d = b._aiScore - a._aiScore;
    if (Math.abs(d) > 1e-6) return d;
    return String(a.id).localeCompare(String(b.id));
  });
  return scored;
}
