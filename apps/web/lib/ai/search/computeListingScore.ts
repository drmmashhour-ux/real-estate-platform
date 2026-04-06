/**
 * BNHub AI search — weighted listing score with fairness caps and small jitter.
 */

import type { ListingSearchMetrics, UserSearchProfile } from "@prisma/client";
import type { AiSearchFilters } from "@/lib/ai/core/types";

export type { AiSearchFilters } from "@/lib/ai/core/types";

export type AiScoreBreakdown = {
  relevance: number;
  performance: number;
  demand: number;
  price: number;
  personalization: number;
  recency: number;
};

export type ComputeListingScoreInput = {
  /** >1 strengthens personalization vs other signals (recommendations rail). */
  personalizationWeight?: number;
  listing: {
    city: string;
    nightPriceCents: number;
    maxGuests: number;
    propertyType: string | null;
    createdAt: Date;
    amenities?: unknown;
  };
  filters: AiSearchFilters;
  metrics: ListingSearchMetrics | null;
  cityAvgNightPriceCents: number | null;
  /** 0–1 from ListingAnalytics.demandScore (0–100) */
  demandScore01: number;
  userProfile: UserSearchProfile | null;
  /** Optional prior from ranking engine order (0 = best, 1 = worst). */
  engineOrderPrior?: number;
  /** Deterministic jitter seed 0–1 for fairness (avoid monopolization). */
  fairnessJitter?: number;
};

const CAP_PERF = 0.28;
const W_REL = 0.22;
const W_PERF = 0.12;
const W_DEM = 0.2;
const W_PRICE = 0.14;
const W_PERS_BASE = 0.18;
const W_REC = 0.08;
const W_ENGINE = 0.06;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function cityRelevance(listingCity: string, filterCity?: string): number {
  if (!filterCity?.trim()) return 0.75;
  const a = norm(listingCity);
  const b = norm(filterCity);
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.88;
  return 0.35;
}

function filterFit(
  listing: ComputeListingScoreInput["listing"],
  filters: AiSearchFilters
): number {
  let pts = 1;
  const minC = filters.minPrice != null && filters.minPrice > 0 ? Math.round(filters.minPrice * 100) : null;
  const maxC = filters.maxPrice != null && filters.maxPrice > 0 ? Math.round(filters.maxPrice * 100) : null;
  const p = listing.nightPriceCents;
  if (minC != null && p < minC * 0.97) pts *= 0.85;
  if (maxC != null && p > maxC * 1.03) pts *= 0.75;
  const g = filters.guests;
  if (g != null && g > 0) {
    if (listing.maxGuests < g) pts *= 0.45;
    else if (listing.maxGuests === g) pts *= 1;
    else pts *= 0.92;
  }
  if (filters.propertyType?.trim()) {
    const want = norm(filters.propertyType);
    const got = listing.propertyType ? norm(listing.propertyType) : "";
    if (got && (got === want || got.includes(want) || want.includes(got))) pts *= 1;
    else pts *= 0.72;
  }
  return Math.min(1, Math.max(0, pts));
}

function amenityOverlap(listingAmenities: unknown, slugs: string[] | undefined): number {
  if (!slugs?.length) return 0.5;
  const arr = Array.isArray(listingAmenities) ? listingAmenities : [];
  const strings = arr.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
  if (!strings.length) return 0.35;
  let hit = 0;
  for (const slug of slugs) {
    const m = slug.replace(/_/g, " ").toLowerCase();
    if (strings.some((s) => s.includes(m))) hit += 1;
  }
  return hit / slugs.length;
}

function performance01(m: ListingSearchMetrics | null): number {
  if (!m) return 0.45;
  const conv = m.conversionRate != null && Number.isFinite(m.conversionRate) ? m.conversionRate : 0;
  const ctr = m.ctr != null && Number.isFinite(m.ctr) ? m.ctr : 0;
  const raw = Math.min(conv * 1.2, 0.45) + Math.min(ctr * 0.9, 0.35);
  return Math.min(CAP_PERF, raw) / CAP_PERF;
}

function demand01(m: ListingSearchMetrics | null, demandScore01: number): number {
  const v = Math.log1p(m?.views7d ?? 0);
  const b = Math.log1p(m?.bookings7d ?? 0);
  const activity = (v / (v + Math.log1p(45))) * 0.55 + (b / (b + Math.log1p(12))) * 0.45;
  return Math.min(1, activity * 0.55 + demandScore01 * 0.45);
}

function priceCompetitiveness(
  nightPriceCents: number,
  cityAvg: number | null
): number {
  if (!cityAvg || cityAvg <= 0) return 0.55;
  const ratio = nightPriceCents / cityAvg;
  if (ratio <= 0.88) return 1;
  if (ratio <= 0.98) return 0.92;
  if (ratio <= 1.08) return 0.78;
  if (ratio <= 1.25) return 0.55;
  return 0.35;
}

function recency01(createdAt: Date): number {
  const days = (Date.now() - createdAt.getTime()) / (86400 * 1000);
  const fresh = Math.exp(-Math.max(0, days - 3) / 120);
  const brandNew = days <= 14 ? 0.15 : 0;
  return Math.min(1, fresh * 0.85 + brandNew + 0.08);
}

function personalization01(
  listing: ComputeListingScoreInput["listing"],
  profile: UserSearchProfile | null,
  filters: AiSearchFilters
): number {
  if (!profile) return 0.5;
  let s = 0;
  let w = 0;
  const cities = profile.preferredCities ?? [];
  if (cities.length) {
    w += 1;
    const hit = cities.some(
      (c) => norm(c) === norm(listing.city) || norm(listing.city).includes(norm(c)) || norm(c).includes(norm(listing.city))
    );
    if (hit) s += 1;
  }
  const types = profile.preferredTypes ?? [];
  if (types.length && listing.propertyType) {
    w += 1;
    const hit = types.some(
      (t) => norm(t) === norm(listing.propertyType!) || norm(listing.propertyType!).includes(norm(t))
    );
    if (hit) s += 1;
  }
  const minP = profile.preferredPriceMin;
  const maxP = profile.preferredPriceMax;
  if (minP != null || maxP != null) {
    w += 1;
    const dollars = listing.nightPriceCents / 100;
    const ok =
      (minP == null || dollars >= minP * 0.95) && (maxP == null || dollars <= maxP * 1.05);
    if (ok) s += 1;
  }
  if (profile.preferredGuests != null && profile.preferredGuests > 0) {
    w += 1;
    if (listing.maxGuests >= profile.preferredGuests) s += 1;
  }
  const am = profile.preferredAmenities ?? [];
  if (am.length) {
    w += 1;
    const overlap = amenityOverlap(listing.amenities, am.map((x) => x.toLowerCase().replace(/\s+/g, "_")));
    s += overlap;
  }
  if (w === 0) return 0.5;
  const base = s / w;
  const filterBoost = filterFit(listing, filters);
  return Math.min(1, base * 0.65 + filterBoost * 0.35);
}

/**
 * Returns score (roughly 0–1+) and normalized breakdown components (each ~0–1).
 */
export function computeListingScore(input: ComputeListingScoreInput): {
  score: number;
  breakdown: AiScoreBreakdown;
} {
  const {
    listing,
    filters,
    metrics,
    cityAvgNightPriceCents,
    demandScore01,
    userProfile,
    engineOrderPrior,
    fairnessJitter,
    personalizationWeight = 1,
  } = input;

  const wPers = Math.min(0.34, W_PERS_BASE * personalizationWeight);

  const relevance = Math.min(
    1,
    cityRelevance(listing.city, filters.city) * 0.62 + filterFit(listing, filters) * 0.28 + amenityOverlap(listing.amenities, filters.amenitySlugs) * 0.1
  );
  const performance = performance01(metrics);
  const demand = demand01(metrics, demandScore01);
  const price = priceCompetitiveness(listing.nightPriceCents, cityAvgNightPriceCents);
  const personalization = personalization01(listing, userProfile, filters);
  const recency = recency01(listing.createdAt);

  let score =
    W_REL * relevance +
    W_PERF * performance +
    W_DEM * demand +
    W_PRICE * price +
    wPers * personalization +
    W_REC * recency;

  if (engineOrderPrior != null && Number.isFinite(engineOrderPrior)) {
    const prior = Math.max(0, Math.min(1, 1 - engineOrderPrior));
    score += W_ENGINE * prior;
  }

  const jitter = fairnessJitter != null ? fairnessJitter * 0.018 : Math.random() * 0.018;
  score += jitter;

  return {
    score,
    breakdown: {
      relevance,
      performance,
      demand,
      price,
      personalization,
      recency,
    },
  };
}

export type AiUiLabel = "Best match" | "High demand" | "Great value" | "Popular choice";

export function deriveAiUiLabels(
  breakdown: AiScoreBreakdown,
  rankIndex: number,
  total: number
): AiUiLabel[] {
  const labels: AiUiLabel[] = [];
  const topShare = total > 0 ? rankIndex / total : 1;
  if (topShare <= 0.12 && breakdown.relevance >= 0.72 && breakdown.personalization >= 0.55) {
    labels.push("Best match");
  }
  if (breakdown.demand >= 0.72) labels.push("High demand");
  if (breakdown.price >= 0.82) labels.push("Great value");
  if (breakdown.demand >= 0.55 && breakdown.performance >= 0.65) labels.push("Popular choice");
  return [...new Set(labels)].slice(0, 3);
}
