/**
 * BNHub listing ranking (advisory ordering + explainability; no listing mutations).
 */

export type BNHubRankingSignalStrength = "low" | "medium" | "strong";

export type BNHubListingScoreBreakdown = {
  conversionScore: number;
  qualityScore: number;
  trustScore: number;
  freshnessScore: number;
  priceCompetitivenessScore: number;
};

export type BNHubListingRanking = {
  listingId: string;
  finalScore: number;
  breakdown: BNHubListingScoreBreakdown;
  signalStrength: BNHubRankingSignalStrength;
  why: string[];
};

/** Minimal listing snapshot for deterministic scoring (search / admin / fusion). */
export type BNHubListingRankingInput = {
  listingId: string;
  nightPriceCents: number;
  maxGuests: number;
  description: string | null;
  amenities: unknown;
  photos: unknown;
  updatedAt: Date;
  createdAt: Date;
  city: string;
  _count: { reviews: number; bookings: number };
  /** Search attaches aggregated review row when present. */
  reviews?: { propertyRating: number }[];
};

export type BNHubRankingContext = {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  /** Median night price (cents) across the cohort for competitiveness. */
  cohortMedianNightCents: number;
  /** Max night price in cohort (for safe normalization). */
  cohortMaxNightCents: number;
};

export type BNHubRankingMarketSummary = {
  sampleSize: number;
  avgFinalScore: number;
  strongPct: number;
  weakCount: number;
  computedAt: string;
};
