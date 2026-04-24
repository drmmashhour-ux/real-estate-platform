/**
 * Explainable marketplace ranking — weighted blend + explicit penalties/premium (no hidden favoritism).
 */

import type { BnhubListingForRanking } from "@/lib/ai/bnhub-search";
import type { ListingSearchRankContext } from "@/lib/bnhub/ranking/listing-ranking";
import {
  blendedListingQuality01,
  computeAvailabilityScore,
  computeFreshnessScore,
  computePerformanceScore,
  isListingPublishedForMarketplace,
} from "@/lib/bnhub/ranking/listing-ranking";
import type { MemoryRankHint } from "@/lib/marketplace-memory/memory-ranking-hint";
import { memoryListingAffinity01 } from "@/lib/marketplace-memory/memory-ranking-hint";
import { hashRankingContext } from "@/lib/marketplace-ranking/ranking-context-hash";
import { getMarketplaceRankingWeights } from "@/lib/marketplace-ranking/ranking-weights";
import type {
  ListingRankingBreakdown,
  ListingRankingPenaltyReason,
  ListingRankingSignals,
  RankingContext,
  RankingSortIntent,
} from "@/lib/marketplace-ranking/ranking.types";

export type RankableListingInput = BnhubListingForRanking & {
  hostAvgResponseHours?: number | null;
  /** 0–1 from `HostPerformance.cancellationRate` when joined. */
  hostCancellationRate?: number | null;
  esgSignal01?: number | null;
  duplicateSuspected?: boolean;
  complianceBlocked?: boolean;
};

export type RankListingsAlgorithmOptions = {
  memoryHint?: MemoryRankHint | null;
  promotedIds?: Set<string> | null;
  cohort?: string | null;
  listingType?: string;
  /** Bounded 0–1 guest-AI affinity per listing id — applied as small transparent personalization slice. */
  guestAiListingAffinity?: Map<string, number> | null;
};

export type RankedListingResult<T> = {
  listing: T;
  breakdown: ListingRankingBreakdown;
  totalScore: number;
};

export type RankListingsAlgorithmOutput<T> = {
  ranked: RankedListingResult<T>[];
  contextHash: string;
  weightsPresetKey: string;
};

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\wÀ-ÿ]/g, ""))
    .filter((t) => t.length > 1);
}

function relevanceFromQuery(listing: RankableListingInput, query: string | null | undefined): number {
  if (!query?.trim()) return 0.55;
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0.55;
  const hay = `${listing.title ?? ""} ${listing.description ?? ""} ${listing.city ?? ""}`;
  const h = hay.toLowerCase();
  let hit = 0;
  for (const t of tokens) {
    if (h.includes(t)) hit += 1;
  }
  return clamp01(0.35 + (hit / tokens.length) * 0.65);
}

function locationFit(listing: RankableListingInput, locationFilter: string | undefined): number {
  if (!locationFilter?.trim()) return 0.55;
  const a = norm(listing.city);
  const b = norm(locationFilter);
  if (!a) return 0.35;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.82;
  return 0.25;
}

function priceFitScore(
  nightPriceCents: number,
  minPrice?: number,
  maxPrice?: number,
  marketAvgCents?: number,
): number {
  const price = nightPriceCents > 0 ? nightPriceCents / 100 : 0;
  if (minPrice != null && maxPrice != null && minPrice > 0 && maxPrice >= minPrice) {
    if (price >= minPrice && price <= maxPrice) return 1;
    const mid = (minPrice + maxPrice) / 2;
    const span = Math.max(1, maxPrice - minPrice);
    const dist = Math.min(Math.abs(price - minPrice), Math.abs(price - maxPrice), Math.abs(price - mid));
    return clamp01(1 - Math.min(1, dist / (span * 2)));
  }
  if (marketAvgCents && marketAvgCents > 0 && nightPriceCents > 0) {
    const ratio = nightPriceCents / marketAvgCents;
    if (ratio >= 0.85 && ratio <= 1.15) return 0.95;
    return clamp01(1 - Math.min(1, Math.abs(ratio - 1)));
  }
  return 0.55;
}

function propertyTypeMatch(listing: RankableListingInput, filterType: string | undefined): number {
  if (!filterType?.trim()) return 0.55;
  const a = norm(listing.propertyType);
  const b = norm(filterType);
  if (!a) return 0.4;
  if (a === b || a.includes(b) || b.includes(a)) return 1;
  return 0.35;
}

function guestFit(listing: RankableListingInput, guests: number | undefined): number {
  if (guests == null || guests <= 0) return 0.55;
  const max = listing.maxGuests ?? 0;
  if (max <= 0) return 0.45;
  if (max >= guests) return clamp01(0.65 + Math.min(0.35, (max - guests) / 20));
  return 0.25;
}

function responseSpeed01(hours: number | null | undefined): number {
  if (hours == null || !Number.isFinite(hours)) return 0.5;
  if (hours <= 2) return 1;
  if (hours <= 12) return 0.85;
  if (hours <= 24) return 0.68;
  if (hours <= 72) return 0.45;
  return 0.28;
}

function engagement01(listing: RankableListingInput): number {
  const bookings = listing._count?.bookings ?? 0;
  if (bookings <= 0) return 0.38;
  return clamp01(Math.log10(1 + bookings) / Math.log10(1 + 40));
}

function trust01(listing: RankableListingInput): number {
  const perf = computePerformanceScore(listing);
  const rep = listing.hostReputationScore;
  let t = perf;
  if (rep != null && Number.isFinite(rep)) {
    t = clamp01(t * 0.65 + (rep / 100) * 0.35);
  }
  const vs = norm(listing.verificationStatus);
  if (vs === "rejected" || vs === "REJECTED") return Math.min(t, 0.25);
  if (vs === "verified" || vs === "VERIFIED") return clamp01(t + 0.06);
  return t;
}

function collectPenalties(listing: RankableListingInput, ctx: ListingSearchRankContext): {
  multiplier: number;
  reasons: ListingRankingPenaltyReason[];
} {
  const reasons: ListingRankingPenaltyReason[] = [];
  let m = 1;

  const q = blendedListingQuality01(listing);
  if (q < 0.32) {
    m *= 0.88;
    reasons.push("incomplete_profile");
  }

  if (listing.hostAvgResponseHours != null && listing.hostAvgResponseHours > 36) {
    m *= 0.92;
    reasons.push("low_host_responsiveness");
  }

  const vs = norm(listing.verificationStatus);
  if (vs === "rejected" || vs === "REJECTED") {
    m *= 0.68;
    reasons.push("verification_rejected");
  }

  if (listing.duplicateSuspected) {
    m *= 0.55;
    reasons.push("duplicate_suspected");
  }

  if (listing.complianceBlocked) {
    m *= 0.5;
    reasons.push("compliance_flag");
  }

  if (listing.availableForRequestedDates === false && ctx.checkIn && ctx.checkOut) {
    m *= 0.35;
    reasons.push("unavailable_for_dates");
  }

  const cxl = listing.hostCancellationRate;
  if (cxl != null && Number.isFinite(cxl) && cxl > 0.12) {
    m *= Math.max(0.72, 1 - Math.min(0.25, (cxl - 0.12) * 1.2));
    reasons.push("elevated_host_cancellation");
  }

  return { multiplier: m, reasons };
}

function explainFromSignals(
  signals: ListingRankingSignals,
  relevanceComposite: number,
  weights: Record<string, number>,
  personalizationBoost: number,
  penalties: ListingRankingPenaltyReason[],
): string[] {
  const convBlend = clamp01(signals.closeProbabilityScore * 0.5 + signals.bookingProbabilityScore * 0.5);
  const pairs: { k: string; v: number; w: number }[] = [
    { k: "relevance (location + query)", v: relevanceComposite, w: weights.relevance },
    { k: "price fit", v: signals.priceFitScore, w: weights.priceFit },
    { k: "property match", v: signals.propertyMatchScore, w: weights.propertyMatch },
    { k: "freshness", v: signals.freshnessScore, w: weights.freshness },
    { k: "quality / completeness", v: signals.qualityScore, w: weights.quality },
    { k: "trust & reviews", v: signals.trustScore, w: weights.trust },
    { k: "engagement", v: signals.engagementScore, w: weights.engagement },
    { k: "response speed", v: signals.responseSpeedScore, w: weights.responseSpeed },
    { k: "conversion signals", v: convBlend, w: weights.conversion },
  ];
  const top = [...pairs].sort((a, b) => b.v * b.w - a.v * a.w).slice(0, 3);
  const parts = top.map((p) => `${p.k} (${(p.v * 100).toFixed(0)}%)`);
  const lines = [`Ranked strongly on: ${parts.join(", ")}.`];
  if (personalizationBoost > 0.02) {
    lines.push("Small bounded boost from your saved marketplace preferences (disclosable in Memory settings).");
  }
  if (penalties.length > 0) {
    lines.push(`Penalties applied (transparent): ${penalties.join(", ")}.`);
  }
  if (signals.premiumBoostScore > 0) {
    lines.push("Includes a bounded promoted-placement bonus (policy-disclosed; not hidden).");
  }
  return lines;
}

function buildSignals(
  listing: RankableListingInput,
  context: RankingContext,
  rankCtx: ListingSearchRankContext,
  filters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    guests?: number;
  },
  marketAvgCents: number,
): { signals: ListingRankingSignals; relevanceComposite: number } {
  const relQuery = relevanceFromQuery(listing, context.searchQuery);
  const loc = locationFit(listing, filters.location);
  const relevanceComposite = clamp01(relQuery * 0.45 + loc * 0.55);

  const priceFit = priceFitScore(
    listing.nightPriceCents ?? 0,
    filters.minPrice,
    filters.maxPrice,
    marketAvgCents,
  );
  const prop = clamp01(propertyTypeMatch(listing, filters.propertyType) * 0.65 + guestFit(listing, filters.guests) * 0.35);

  const freshness = computeFreshnessScore(listing);
  const quality = blendedListingQuality01(listing);
  const trust = trust01(listing);
  const engagement = engagement01(listing);
  const responseSpeed = responseSpeed01(listing.hostAvgResponseHours ?? null);
  const performance = computePerformanceScore(listing);
  const availability = computeAvailabilityScore(listing, rankCtx);
  const bookingProb = clamp01(performance * 0.55 + availability * 0.45);
  const closeProb = clamp01(performance * 0.72 + trust * 0.28);

  const esg = clamp01(listing.esgSignal01 ?? 0);

  return {
    relevanceComposite,
    signals: {
      listingId: listing.id,
      priceFitScore: priceFit,
      locationFitScore: loc,
      propertyMatchScore: prop,
      freshnessScore: freshness,
      qualityScore: quality,
      trustScore: trust,
      engagementScore: engagement,
      responseSpeedScore: responseSpeed,
      closeProbabilityScore: closeProb,
      bookingProbabilityScore: bookingProb,
      esgBonusScore: esg,
      premiumBoostScore: 0,
    },
  };
}

export function buildRankingContextPayload(
  filters: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
  },
  opts: {
    userId?: string | null;
    searchQuery?: string | null;
    marketSegment?: RankingContext["marketSegment"];
    sortIntent: RankingSortIntent;
    mapBoundsJson?: Record<string, unknown> | null;
  },
): RankingContext {
  return {
    userId: opts.userId,
    searchQuery: opts.searchQuery,
    filtersJson: {
      ...filters,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
    },
    mapBoundsJson: opts.mapBoundsJson ?? null,
    marketSegment: opts.marketSegment ?? "SHORT_TERM",
    sortIntent: opts.sortIntent,
  };
}

export function rankListingsAlgorithm<T extends RankableListingInput>(
  context: RankingContext,
  listings: T[],
  options?: RankListingsAlgorithmOptions,
): RankListingsAlgorithmOutput<T> {
  const { weights, presetKey } = getMarketplaceRankingWeights(options?.cohort ?? null);
  const cohort = options?.cohort ?? process.env.RANKING_ALGO_COHORT ?? null;
  const contextHash = hashRankingContext(context, cohort);

  const f = context.filtersJson as {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    guests?: number;
  };

  const fj = context.filtersJson as Record<string, unknown>;
  const rankCtx: ListingSearchRankContext = {
    checkIn: typeof fj.checkIn === "string" ? fj.checkIn : undefined,
    checkOut: typeof fj.checkOut === "string" ? fj.checkOut : undefined,
  };

  const marketAvgCents =
    listings.length > 0
      ? listings.reduce((s, l) => s + (l.nightPriceCents ?? 0), 0) / listings.length
      : 0;

  const memoryHint = options?.memoryHint ?? null;
  const promoted = options?.promotedIds ?? null;

  const ranked: RankedListingResult<T>[] = listings.map((listing) => {
    if (!isListingPublishedForMarketplace(listing)) {
      const built = buildSignals(listing, context, rankCtx, f, marketAvgCents);
      const breakdown: ListingRankingBreakdown = {
        weightsVersion: presetKey,
        cohort,
        relevanceComposite: built.relevanceComposite,
        weightedSubtotal: 0,
        personalizationBoost: 0,
        penaltyMultiplier: 1,
        penalties: [],
        premiumAdditive: 0,
        totalScore: 0,
        signals: { ...built.signals, premiumBoostScore: 0 },
        explain: ["Not eligible — listing is not published for marketplace search."],
        excluded: true,
        exclusionReason: "not_published",
      };
      return { listing, breakdown, totalScore: 0 };
    }

    const built = buildSignals(listing, context, rankCtx, f, marketAvgCents);
    const { signals, relevanceComposite: rel } = built;

    let personalizationBoost = 0;
    if (memoryHint) {
      personalizationBoost = clamp01(memoryListingAffinity01(listing, memoryHint) * 0.08);
    }
    const guestAi = options?.guestAiListingAffinity?.get(listing.id);
    if (guestAi != null && Number.isFinite(guestAi)) {
      personalizationBoost = clamp01(personalizationBoost + clamp01(guestAi) * 0.06);
    }

    const esgSlice = 0.03;
    const convWeight = weights.conversion;

    const weightedSubtotal = clamp01(
      rel * weights.relevance +
        signals.priceFitScore * weights.priceFit +
        signals.propertyMatchScore * weights.propertyMatch +
        signals.freshnessScore * weights.freshness +
        signals.qualityScore * weights.quality +
        signals.trustScore * weights.trust +
        signals.engagementScore * weights.engagement +
        signals.responseSpeedScore * weights.responseSpeed +
        signals.bookingProbabilityScore * convWeight * 0.55 +
        signals.closeProbabilityScore * convWeight * 0.45 +
        signals.esgBonusScore * esgSlice,
    );

    const { multiplier: penaltyMultiplier, reasons: penalties } = collectPenalties(listing, rankCtx);

    let premiumAdditive = 0;
    if (promoted?.has(listing.id)) {
      premiumAdditive = 0.04;
      signals.premiumBoostScore = 1;
    } else {
      signals.premiumBoostScore = 0;
    }

    const adjusted = clamp01(weightedSubtotal + personalizationBoost + premiumAdditive);
    const total01 = clamp01(adjusted * penaltyMultiplier);
    const totalScore = Math.round(total01 * 10000) / 100;

    const breakdown: ListingRankingBreakdown = {
      weightsVersion: presetKey,
      cohort,
      relevanceComposite: rel,
      weightedSubtotal: Math.round(weightedSubtotal * 1000) / 1000,
      personalizationBoost: Math.round(personalizationBoost * 1000) / 1000,
      penaltyMultiplier: Math.round(penaltyMultiplier * 1000) / 1000,
      penalties,
      premiumAdditive: Math.round(premiumAdditive * 1000) / 1000,
      totalScore,
      signals,
      explain: explainFromSignals(
        signals,
        rel,
        { ...weights, conversion: convWeight },
        personalizationBoost,
        penalties,
      ),
      excluded: false,
    };

    return { listing, breakdown, totalScore };
  });

  ranked.sort((a, b) => {
    if (a.breakdown.excluded !== b.breakdown.excluded) return a.breakdown.excluded ? 1 : -1;
    const d = b.totalScore - a.totalScore;
    if (Math.abs(d) > 1e-6) return d;
    return String(a.listing.id).localeCompare(String(b.listing.id));
  });

  return { ranked, contextHash, weightsPresetKey: presetKey };
}
