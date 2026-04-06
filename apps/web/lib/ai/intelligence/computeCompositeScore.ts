import type {
  CompositeScoreResult,
  IntelligenceDomain,
  IntelligenceScores,
  ListingSignals,
  SearchContext,
  UserSignals,
} from "@/lib/ai/core/types";
import { buildExplanation, buildTrendLabel } from "./buildExplanation";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function cityMatch(a: string, b: string): number {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return 0.5;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.88;
  return 0.35;
}

function relevanceFromSearch(listing: ListingSignals, ctx: SearchContext | undefined): number {
  if (!ctx?.filters) return 0.72;
  const f = ctx.filters;
  let s = cityMatch(listing.city, f.city ?? "");
  const minC = f.minPrice != null && f.minPrice > 0 ? f.minPrice * 100 : null;
  const maxC = f.maxPrice != null && f.maxPrice > 0 ? f.maxPrice * 100 : null;
  const p = listing.nightPriceCents;
  if (minC != null && p < minC * 0.97) s *= 0.88;
  if (maxC != null && p > maxC * 1.03) s *= 0.78;
  if (f.guests != null && f.guests > 0) {
    const g = listing.maxGuests;
    if (g < f.guests) s *= 0.45;
    else if (g === f.guests) s *= 1;
    else s *= 0.92;
  }
  if (f.propertyType?.trim() && listing.propertyType) {
    const pt = f.propertyType.trim().toLowerCase();
    const got = listing.propertyType.toLowerCase();
    if (!got.includes(pt) && !pt.includes(got)) s *= 0.72;
  }
  return clamp01(s);
}

function qualityScoreFromFlags(s: ListingSignals): number {
  let pen = 0;
  if (s.qualityFlags.lowPhotoCount) pen += 0.12;
  if (s.qualityFlags.weakDescription) pen += 0.1;
  if (s.qualityFlags.weakTitle) pen += 0.08;
  if (s.qualityFlags.missingAmenities) pen += 0.06;
  return clamp01(1 - pen);
}

function priceCompetitiveness(s: ListingSignals): number {
  const avg = s.avgAreaNightPrice;
  if (!avg || avg <= 0) return 0.55;
  const ratio = s.currentPrice / avg;
  if (ratio <= 0.88) return 1;
  if (ratio <= 0.98) return 0.9;
  if (ratio <= 1.08) return 0.75;
  if (ratio <= 1.25) return 0.52;
  return 0.35;
}

function personalizationScore(listing: ListingSignals, user: UserSignals | null): number {
  if (!user) return 0.5;
  let pts = 0;
  let w = 0;
  if (user.preferredCities.length) {
    w += 1;
    if (user.preferredCities.some((c) => cityMatch(listing.city, c) >= 0.88)) pts += 1;
  }
  if (user.preferredTypes.length && listing.propertyType) {
    w += 1;
    if (user.preferredTypes.some((t) => listing.propertyType!.toLowerCase().includes(t.toLowerCase()))) pts += 1;
  }
  if (user.preferredPriceMin != null || user.preferredPriceMax != null) {
    w += 1;
    const ok =
      (user.preferredPriceMin == null || listing.currentPrice >= user.preferredPriceMin * 0.95) &&
      (user.preferredPriceMax == null || listing.currentPrice <= user.preferredPriceMax * 1.05);
    if (ok) pts += 1;
  }
  if (user.preferredGuests != null && user.preferredGuests > 0) {
    w += 1;
    pts += 0.5;
  }
  if (w === 0) return 0.5;
  return clamp01((pts / w) * 0.7 + user.engagementScore * 0.15 + user.bookingIntentScore * 0.15);
}

function recencyScore(createdAt: Date): number {
  const days = (Date.now() - createdAt.getTime()) / 86400000;
  return clamp01(Math.exp(-Math.max(0, days - 3) / 120) * 0.85 + (days <= 14 ? 0.12 : 0));
}

function confidenceFrom(s: IntelligenceScores): number {
  return clamp01(
    s.demandScore * 0.25 +
      s.conversionScore * 0.2 +
      (1 - Math.abs(0.5 - s.priceCompetitiveness)) * 0.15 +
      s.qualityScore * 0.25 +
      0.15
  );
}

const W: Record<IntelligenceDomain, Partial<Record<keyof IntelligenceScores, number>>> = {
  search: {
    relevanceScore: 0.26,
    demandScore: 0.16,
    conversionScore: 0.12,
    priceCompetitiveness: 0.14,
    qualityScore: 0.08,
    personalizationScore: 0.18,
    recencyScore: 0.06,
  },
  pricing: {
    relevanceScore: 0.05,
    demandScore: 0.28,
    conversionScore: 0.14,
    priceCompetitiveness: 0.28,
    qualityScore: 0.12,
    personalizationScore: 0.05,
    recencyScore: 0.08,
  },
  autopilot: {
    relevanceScore: 0.06,
    demandScore: 0.2,
    conversionScore: 0.16,
    priceCompetitiveness: 0.2,
    qualityScore: 0.22,
    personalizationScore: 0.06,
    recencyScore: 0.1,
  },
  recommendation: {
    relevanceScore: 0.12,
    demandScore: 0.18,
    conversionScore: 0.14,
    priceCompetitiveness: 0.14,
    qualityScore: 0.1,
    personalizationScore: 0.26,
    recencyScore: 0.06,
  },
};

/**
 * Central composite scoring — domain-specific weight rebalance.
 */
export function computeCompositeScore(input: {
  domain: IntelligenceDomain;
  listing: ListingSignals;
  userSignals: UserSignals | null;
  searchContext?: SearchContext;
  /** 0 = best rank position, 1 = worst — optional blend from legacy ranking engine. */
  engineOrderPrior?: number;
}): CompositeScoreResult {
  const { domain, listing, userSignals, searchContext } = input;

  const relevanceScore =
    domain === "search" || domain === "recommendation"
      ? relevanceFromSearch(listing, searchContext)
      : 0.65;

  const demandScore = clamp01(listing.demandScore);
  const conversionScore = clamp01((listing.conversionRate * 0.55 + listing.ctr * 0.45) * 1.15);
  const priceComp = priceCompetitiveness(listing);
  const qualityScore = qualityScoreFromFlags(listing);
  const pers = personalizationScore(listing, userSignals);
  const recency = recencyScore(listing.createdAt);

  const scores: IntelligenceScores = {
    relevanceScore,
    demandScore,
    conversionScore,
    priceCompetitiveness: priceComp,
    qualityScore,
    personalizationScore: pers,
    recencyScore: recency,
    confidenceScore: 0,
  };

  scores.confidenceScore = confidenceFrom(scores);

  const weights = W[domain];
  let sum = 0;
  let wsum = 0;
  for (const k of Object.keys(weights) as (keyof IntelligenceScores)[]) {
    const w = weights[k];
    if (w == null || k === "confidenceScore") continue;
    sum += scores[k] * w;
    wsum += w;
  }

  let aiCompositeScore = wsum > 0 ? sum / wsum : 0.5;

  if (input.engineOrderPrior != null && Number.isFinite(input.engineOrderPrior)) {
    aiCompositeScore = aiCompositeScore * 0.88 + (1 - input.engineOrderPrior) * 0.12;
  }

  const trendLabel = buildTrendLabel(listing);
  const explanation = buildExplanation(domain, scores, listing);
  return {
    scores,
    aiCompositeScore: clamp01(aiCompositeScore),
    explanation,
    confidenceScore: scores.confidenceScore,
    trendLabel,
  };
}
