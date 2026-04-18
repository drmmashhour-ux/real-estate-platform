/**
 * Marketplace listing ranking for BNHUB search/browse (explainable, deterministic).
 * Uses only fields present on the listing / context — no fabricated reviews or metrics.
 */

import { LoyaltyTier } from "@prisma/client";
import { hostReputationMarketplaceModifier } from "@/lib/ai/reputation/reputation-engine";

export const MARKETPLACE_RANK_WEIGHTS = {
  quality: 0.35,
  performance: 0.3,
  availability: 0.2,
  freshness: 0.15,
} as const;

export type ListingForMarketplaceRank = {
  listingStatus?: string | null;
  title?: string | null;
  description?: string | null;
  photos?: unknown;
  amenities?: unknown;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  _count?: { reviews?: number; bookings?: number };
  reviews?: { propertyRating?: number }[];
  /** Denormalized BNHUB fields when selected */
  bnhubListingRatingAverage?: number | null;
  bnhubListingReviewCount?: number | null;
  bnhubListingCompletedStays?: number | null;
  /**
   * When search includes dates: false = known conflict (score availability at 0).
   * When true or omitted with dates, treated as available (caller may pre-filter).
   */
  availableForRequestedDates?: boolean;
  /** Optional enrichment — if absent, total booking count is used only when present. */
  bookingsLast90d?: number | null;
  /** Host reputation 0–100 — optional small marketplace nudge; never used to hide listings. */
  hostReputationScore?: number | null;
  /**
   * 0–1 from cached `listing_quality_scores` (see `lib/quality`). When set, blended into the
   * on-page quality heuristic so ranking reflects long-run quality, pricing fit, and trust.
   */
  cachedListingQuality01?: number | null;
};

export type ListingSearchRankContext = {
  checkIn?: string;
  checkOut?: string;
  /** Logged-in guest BNHUB tier — tiny ranking nudge for repeat guests (no price override). */
  guestLoyaltyTier?: LoyaltyTier;
};

export type ListingSearchScoreResult = {
  /** Final score in [0, 1]. Non-published listings score 0 with excluded: true. */
  score: number;
  components: {
    quality: number;
    performance: number;
    availability: number;
    freshness: number;
  };
  /** Weights after renormalization (e.g. availability dropped when no dates). */
  weightsEffective: {
    quality: number;
    performance: number;
    availability: number;
    freshness: number;
  };
  excluded?: boolean;
};

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function daysSince(d: string | Date | null | undefined): number | null {
  if (d == null) return null;
  const t = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}

export function countListingPhotos(photos: unknown): number {
  if (!Array.isArray(photos)) return 0;
  return photos.filter((x): x is string => typeof x === "string" && x.trim().length > 0).length;
}

export function countListingAmenities(amenities: unknown): number {
  if (!Array.isArray(amenities)) return 0;
  return amenities.length;
}

/** Published-only marketplace eligibility. */
export function isListingPublishedForMarketplace(listing: Pick<ListingForMarketplaceRank, "listingStatus">): boolean {
  return listing.listingStatus === "PUBLISHED";
}

function hasDateFilter(ctx: ListingSearchRankContext): boolean {
  return Boolean(ctx.checkIn?.trim() && ctx.checkOut?.trim());
}

/**
 * When search has no check-in/out, availability signal is omitted and weights renormalized.
 */
export function effectiveMarketplaceWeights(ctx: ListingSearchRankContext): {
  quality: number;
  performance: number;
  availability: number;
  freshness: number;
} {
  const { quality, performance, availability, freshness } = MARKETPLACE_RANK_WEIGHTS;
  if (hasDateFilter(ctx)) {
    return { quality, performance, availability, freshness };
  }
  const sum = quality + performance + freshness;
  return {
    quality: quality / sum,
    performance: performance / sum,
    availability: 0,
    freshness: freshness / sum,
  };
}

function scoreTitleQuality(title: string | undefined | null): number {
  const t = (title ?? "").trim();
  if (t.length === 0) return 0;
  if (t.length < 10) return 0.45;
  if (t.length < 30) return 0.78;
  return 1;
}

function scoreDescriptionCompleteness(description: string | undefined | null): number {
  const n = (description ?? "").trim().length;
  if (n === 0) return 0.15;
  if (n < 100) return 0.38;
  if (n < 400) return 0.72;
  return 1;
}

function scorePhotoCount(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 0.42;
  if (count <= 5) return 0.78;
  return 1;
}

function scoreAmenityCount(count: number): number {
  if (count <= 0) return 0.28;
  if (count <= 3) return 0.52;
  if (count <= 8) return 0.82;
  return 1;
}

/** Quality subscores 0–1, equal blend of four signals. */
export function computeQualityScore(listing: ListingForMarketplaceRank): number {
  const q1 = scoreTitleQuality(listing.title);
  const q2 = scoreDescriptionCompleteness(listing.description);
  const q3 = scorePhotoCount(countListingPhotos(listing.photos));
  const q4 = scoreAmenityCount(countListingAmenities(listing.amenities));
  return clamp01((q1 + q2 + q3 + q4) / 4);
}

/** Blends fast on-page heuristics with persisted listing quality score when available. */
export function blendedListingQuality01(listing: ListingForMarketplaceRank): number {
  const heuristic = computeQualityScore(listing);
  const c = listing.cachedListingQuality01;
  if (c == null || !Number.isFinite(c)) return heuristic;
  return clamp01(heuristic * 0.42 + c * 0.58);
}

function avgReviewRating(listing: ListingForMarketplaceRank): number | null {
  if (listing.bnhubListingRatingAverage != null && Number.isFinite(listing.bnhubListingRatingAverage)) {
    return listing.bnhubListingRatingAverage;
  }
  const rs = listing.reviews;
  if (rs && rs.length > 0) {
    const sum = rs.reduce((s, r) => s + (r.propertyRating ?? 0), 0);
    return sum / rs.length;
  }
  return null;
}

function reviewCount(listing: ListingForMarketplaceRank): number {
  if (listing.bnhubListingReviewCount != null && listing.bnhubListingReviewCount >= 0) {
    return listing.bnhubListingReviewCount;
  }
  return listing._count?.reviews ?? 0;
}

function bookingCountSignal(listing: ListingForMarketplaceRank): number {
  if (listing.bookingsLast90d != null && listing.bookingsLast90d >= 0) return listing.bookingsLast90d;
  return listing._count?.bookings ?? 0;
}

/**
 * Performance: reviews, ratings, booking volume, optional completed stays, simple conversion shape.
 * Missing optional fields use neutral mid-bands inside the blend (no fake numbers).
 */
export function computePerformanceScore(listing: ListingForMarketplaceRank): number {
  const avg = avgReviewRating(listing);
  const rc = reviewCount(listing);
  const bc = bookingCountSignal(listing);
  const stays = listing.bnhubListingCompletedStays ?? null;

  const ratingPart =
    avg == null ? 0.48 : clamp01((avg - 3) / 2) * 0.7 + 0.3; /* map ~3–5 to ~0.3–1 */

  const reviewVolumePart = rc <= 0 ? 0.42 : clamp01(Math.log10(1 + rc) / Math.log10(1 + 50));

  const bookingPart =
    bc <= 0 ? 0.36 : bc <= 2 ? 0.52 : bc <= 8 ? 0.72 : bc <= 25 ? 0.88 : 1;

  const repeatPart =
    stays == null ? 0.5 : stays <= 0 ? 0.4 : clamp01(Math.min(1, stays / 15));

  let conversionPart = 0.5;
  if (bc > 0 && rc >= 0) {
    conversionPart = clamp01(Math.min(1, (rc / bc) * 2.5));
  }

  return clamp01((ratingPart + reviewVolumePart + bookingPart + repeatPart + conversionPart) / 5);
}

/** Freshness from updatedAt, fallback createdAt. */
export function computeFreshnessScore(listing: ListingForMarketplaceRank): number {
  const dUp = daysSince(listing.updatedAt ?? undefined);
  const dCr = daysSince(listing.createdAt ?? undefined);
  const age = dUp ?? dCr ?? 180;

  if (age <= 7) return 1;
  if (age <= 30) return 0.88;
  if (age <= 90) return 0.68;
  if (age <= 365) return 0.48;
  return 0.32;
}

/**
 * With date filter: unavailable → 0; available/unknown → 1 (unknown assumes pre-filtered lists).
 * Without date filter: neutral 0.5 (unused — weight 0 after renormalization).
 */
export function computeAvailabilityScore(
  listing: ListingForMarketplaceRank,
  ctx: ListingSearchRankContext,
): number {
  if (!hasDateFilter(ctx)) return 0.5;
  if (listing.availableForRequestedDates === false) return 0;
  return 1;
}

export function scoreListingForSearch(
  listing: ListingForMarketplaceRank,
  context: ListingSearchRankContext = {},
): ListingSearchScoreResult {
  if (!isListingPublishedForMarketplace(listing)) {
    return {
      score: 0,
      components: { quality: 0, performance: 0, availability: 0, freshness: 0 },
      weightsEffective: effectiveMarketplaceWeights(context),
      excluded: true,
    };
  }

  const weights = effectiveMarketplaceWeights(context);
  const quality = blendedListingQuality01(listing);
  const performance = computePerformanceScore(listing);
  const availability = computeAvailabilityScore(listing, context);
  const freshness = computeFreshnessScore(listing);

  let score = clamp01(
    quality * weights.quality +
      performance * weights.performance +
      availability * weights.availability +
      freshness * weights.freshness,
  );

  if (listing.hostReputationScore != null && Number.isFinite(listing.hostReputationScore)) {
    score = clamp01(score * hostReputationMarketplaceModifier(listing.hostReputationScore));
  }

  const t = context.guestLoyaltyTier;
  if (t === LoyaltyTier.GOLD) score = clamp01(score + 0.02);
  else if (t === LoyaltyTier.SILVER) score = clamp01(score + 0.012);
  else if (t === LoyaltyTier.BRONZE) score = clamp01(score + 0.006);

  return {
    score,
    components: { quality, performance, availability, freshness },
    weightsEffective: weights,
  };
}

/** Short human-readable reasons for admin / debug (not for public guests by default). */
export function explainListingScore(
  listing: ListingForMarketplaceRank,
  context: ListingSearchRankContext = {},
): string[] {
  const reasons: string[] = [];

  if (!isListingPublishedForMarketplace(listing)) {
    reasons.push("not a published listing");
    return reasons;
  }

  const q = blendedListingQuality01(listing);
  const photos = countListingPhotos(listing.photos);
  const am = countListingAmenities(listing.amenities);
  const descLen = (listing.description ?? "").trim().length;

  if (q >= 0.72 && photos >= 4 && am >= 4) reasons.push("strong photos and amenities");
  else if (q >= 0.55) reasons.push("solid listing completeness");
  else reasons.push("listing content could be improved");

  if (descLen >= 400) reasons.push("detailed description");
  else if (descLen < 80) reasons.push("short description");

  const perf = computePerformanceScore(listing);
  if (perf >= 0.65) reasons.push("strong guest feedback or booking activity");
  else if (perf <= 0.45) reasons.push("limited reviews or booking history yet");

  if (hasDateFilter(context)) {
    if (listing.availableForRequestedDates === false) reasons.push("not available for selected dates");
    else reasons.push("available for selected dates");
  }

  const fr = computeFreshnessScore(listing);
  if (fr >= 0.75) reasons.push("listing recently updated");
  else if (fr <= 0.42) reasons.push("listing has not been updated recently");

  const stays = listing.bnhubListingCompletedStays;
  if (stays != null && stays >= 3) reasons.push("repeat stay history on record");

  return reasons;
}

/**
 * Sort listings by marketplace score descending. Mutates order via new array.
 */
export function sortListingsByMarketplaceScore<T extends ListingForMarketplaceRank>(
  listings: T[],
  context: ListingSearchRankContext,
): (T & { _marketplaceRankScore: number })[] {
  const scored = listings.map((l) => {
    const { score } = scoreListingForSearch(l, context);
    return { ...l, _marketplaceRankScore: score };
  });
  scored.sort((a, b) => b._marketplaceRankScore - a._marketplaceRankScore);
  return scored;
}
