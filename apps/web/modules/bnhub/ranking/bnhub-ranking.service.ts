/**
 * BNHub Airbnb-style + explainable ranking — ordering only; does not modify listings or payments.
 */

import type {
  BNHubListingRanking,
  BNHubListingRankingInput,
  BNHubRankingContext,
  BNHubRankingMarketSummary,
  BNHubRankingSignalStrength,
} from "./bnhub-ranking.types";
import {
  recordBnhubRankingRun,
} from "./bnhub-ranking-monitoring.service";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function safeLenPhotos(photos: unknown): number {
  return Array.isArray(photos) ? photos.filter((x) => typeof x === "string" && x.length > 0).length : 0;
}

function safeLenAmenities(amenities: unknown): number {
  return Array.isArray(amenities) ? amenities.length : 0;
}

/** A. Conversion (0–30): booking activity + review/booking ratio proxy — neutral mid-band when sparse. */
export function computeConversionScore(listing: BNHubListingRankingInput): number {
  const bookings = listing._count.bookings;
  const reviews = listing._count.reviews;
  let missing = false;
  if (bookings === 0 && reviews === 0) missing = true;

  const logB = Math.log10(1 + bookings);
  const freq = clamp(12 * (logB / Math.log10(51)), 0, 18);
  const ratio = bookings > 0 ? clamp(reviews / Math.max(1, bookings), 0, 3) : 0;
  const ratioPts = clamp(ratio * 4, 0, 12);
  let score = clamp(freq + ratioPts, 0, 30);
  if (missing) {
    score = 14;
  }
  return Math.round(score * 10) / 10;
}

/** B. Quality (0–20): photos, amenities, description, guests clarity. */
export function computeQualityScore(listing: BNHubListingRankingInput): number {
  const photos = safeLenPhotos(listing.photos);
  const amenities = safeLenAmenities(listing.amenities);
  const descLen = (listing.description ?? "").trim().length;
  const photoPts = photos >= 6 ? 8 : photos >= 3 ? 6 : photos >= 1 ? 3 : 1;
  const amenPts = amenities >= 8 ? 5 : amenities >= 3 ? 4 : amenities >= 1 ? 2 : 0;
  const descPts = descLen >= 200 ? 4 : descLen >= 80 ? 3 : descLen >= 20 ? 2 : 0;
  const guestPts = listing.maxGuests >= 1 && listing.maxGuests <= 16 ? 3 : 2;
  return Math.round(clamp(photoPts + amenPts + descPts + guestPts, 0, 20) * 10) / 10;
}

/** C. Trust (0–20): ratings + volume + bookings completed (proxy via count). */
export function computeTrustScore(listing: BNHubListingRankingInput): number {
  const rc = listing._count.reviews;
  const avg =
    listing.reviews && listing.reviews.length > 0
      ? listing.reviews.reduce((s, r) => s + (Number(r.propertyRating) || 0), 0) / listing.reviews.length
      : 0;
  const ratingPts = avg > 0 ? clamp((avg / 5) * 10, 0, 10) : 4;
  const volumePts = clamp(Math.min(rc, 40) * 0.2, 0, 6);
  const bookingSignal = clamp(Math.log10(1 + listing._count.bookings) * 2, 0, 4);
  return Math.round(clamp(ratingPts + volumePts + bookingSignal, 0, 20) * 10) / 10;
}

/** D. Freshness (0–10): recency of updates. */
export function computeFreshnessScore(listing: BNHubListingRankingInput): number {
  const u = listing.updatedAt.getTime();
  const days = (Date.now() - u) / (864e5);
  if (!Number.isFinite(days) || days < 0) return 5;
  if (days <= 14) return 10;
  if (days <= 45) return 8;
  if (days <= 120) return 5;
  return 3;
}

/** E. Price competitiveness (0–20): vs cohort median — fair/cheaper scores higher; no punitive “hidden” bans. */
export function computePriceScore(listing: BNHubListingRankingInput, ctx: BNHubRankingContext): number {
  const price = listing.nightPriceCents;
  const med = ctx.cohortMedianNightCents;
  const maxP = Math.max(ctx.cohortMaxNightCents, med, 1);
  if (!Number.isFinite(price) || price <= 0) return 8;
  if (med <= 0) return 12;

  const ratio = price / med;
  if (ratio <= 0.92) return 20;
  if (ratio <= 1) return 17;
  if (ratio <= 1.08) return 14;
  if (ratio <= 1.2) return 10;
  const norm = clamp((maxP - price) / maxP, 0, 1);
  return Math.round(clamp(6 + norm * 4, 4, 12) * 10) / 10;
}

function signalStrength(finalScore: number): BNHubRankingSignalStrength {
  if (finalScore >= 70) return "strong";
  if (finalScore >= 40) return "medium";
  return "low";
}

function buildWhy(
  listing: BNHubListingRankingInput,
  b: BNHubListingRanking["breakdown"],
): string[] {
  const why: string[] = [];
  if (b.conversionScore >= 20) why.push("Strong booking and engagement signals");
  else if (b.conversionScore >= 12) why.push("Moderate booking activity");
  else why.push("Limited historical conversion data — neutral band");

  if (b.qualityScore >= 14) why.push("Well-optimized listing content");
  else if (b.qualityScore >= 8) why.push("Adequate listing detail");

  if (b.trustScore >= 14) why.push("Strong reviews");
  else if (listing._count.reviews === 0) why.push("Few or no reviews yet");

  if (b.freshnessScore >= 8) why.push("Recently active listing");
  if (b.priceCompetitivenessScore >= 14) why.push("Competitive pricing for this cohort");
  else if (b.priceCompetitivenessScore >= 10) why.push("Fair pricing");

  return [...new Set(why)].slice(0, 6);
}

function cohortStats(listings: BNHubListingRankingInput[]): { med: number; max: number } {
  const prices = listings.map((l) => l.nightPriceCents).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return { med: 0, max: 1 };
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  const max = sorted[sorted.length - 1] ?? med;
  return { med, max };
}

/**
 * Scores each listing and returns sorted rankings (same length as input; no rows removed).
 * @param options.skipMonitoring — when true, skips `[bnhub:ranking]` counter (e.g. host performance dashboard).
 */
export function computeBNHubListingRanking(
  listings: BNHubListingRankingInput[],
  context: Partial<BNHubRankingContext> = {},
  options?: { skipMonitoring?: boolean },
): BNHubListingRanking[] {
  const { med, max } = cohortStats(listings);
  const ctx: BNHubRankingContext = {
    ...context,
    cohortMedianNightCents: med,
    cohortMaxNightCents: max,
  };

  const ranked: BNHubListingRanking[] = listings.map((listing) => {
    const conversionScore = computeConversionScore(listing);
    const qualityScore = computeQualityScore(listing);
    const trustScore = computeTrustScore(listing);
    const freshnessScore = computeFreshnessScore(listing);
    const priceCompetitivenessScore = computePriceScore(listing, ctx);
    const breakdown = {
      conversionScore,
      qualityScore,
      trustScore,
      freshnessScore,
      priceCompetitivenessScore,
    };
    const finalScore = clamp(
      conversionScore + qualityScore + trustScore + freshnessScore + priceCompetitivenessScore,
      0,
      100,
    );
    const rounded = Math.round(finalScore * 10) / 10;
    return {
      listingId: listing.listingId,
      finalScore: rounded,
      breakdown,
      signalStrength: signalStrength(rounded),
      why: buildWhy(listing, breakdown),
    };
  });

  ranked.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    const tb = b.breakdown.trustScore - a.breakdown.trustScore;
    if (tb !== 0) return tb;
    return b.breakdown.freshnessScore - a.breakdown.freshnessScore;
  });

  let fallbacks = 0;
  for (const l of listings) {
    if (l._count.bookings === 0 && l._count.reviews === 0) fallbacks += 1;
  }
  if (!options?.skipMonitoring) {
    recordBnhubRankingRun({
      listingsRanked: ranked.length,
      avgScore: ranked.length ? ranked.reduce((s, r) => s + r.finalScore, 0) / ranked.length : 0,
      strongListings: ranked.filter((r) => r.signalStrength === "strong").length,
      weakListings: ranked.filter((r) => r.signalStrength === "low").length,
      missingDataFallbacks: fallbacks,
    });
  }

  return ranked;
}

/** Map search result row → ranking input (lossless ids). */
export function bnhubSearchListingToRankingInput(
  row: {
    id: string;
    nightPriceCents: number;
    maxGuests: number;
    description?: string | null;
    amenities: unknown;
    photos: unknown;
    updatedAt: Date;
    createdAt: Date;
    city: string;
    _count: { reviews: number; bookings: number };
    reviews?: { propertyRating: number }[];
  },
): BNHubListingRankingInput {
  return {
    listingId: row.id,
    nightPriceCents: row.nightPriceCents,
    maxGuests: row.maxGuests,
    description: row.description ?? null,
    amenities: row.amenities,
    photos: row.photos,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    city: row.city,
    _count: row._count,
    reviews: row.reviews,
  };
}

export type BnhubSearchListingRow = Parameters<typeof bnhubSearchListingToRankingInput>[0];

/**
 * Reorders search results by V1 ranking. Does not filter. Optionally attaches `bnhubRankingV1` for debug.
 */
export function applyBnhubRankingV1ToSearchResults<T extends BnhubSearchListingRow>(
  results: T[],
  options: {
    attachDebug?: boolean;
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  } = {},
): T[] {
  if (results.length === 0) return results;
  const inputs = results.map(bnhubSearchListingToRankingInput);
  const rankings = computeBNHubListingRanking(inputs, {
    city: options.city,
    checkIn: options.checkIn,
    checkOut: options.checkOut,
    guests: options.guests,
  });
  const order = new Map(rankings.map((r, i) => [r.listingId, i] as const));
  const rankById = new Map(rankings.map((r) => [r.listingId, r] as const));
  const sorted = [...results].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  if (!options.attachDebug) return sorted;

  return sorted.map((row) => ({
    ...row,
    bnhubRankingV1: rankById.get(row.id),
  })) as T[];
}

/**
 * Read-only market summary for growth / fusion (sample of published listings).
 */
export function summarizeBnhubRankingFromRankings(rankings: BNHubListingRanking[]): BNHubRankingMarketSummary {
  const n = rankings.length;
  const avgFinalScore = n ? rankings.reduce((s, r) => s + r.finalScore, 0) / n : 0;
  const strong = rankings.filter((r) => r.signalStrength === "strong").length;
  const weak = rankings.filter((r) => r.signalStrength === "low").length;
  return {
    sampleSize: n,
    avgFinalScore: Math.round(avgFinalScore * 10) / 10,
    strongPct: n ? Math.round((strong / n) * 1000) / 10 : 0,
    weakCount: weak,
    computedAt: new Date().toISOString(),
  };
}
