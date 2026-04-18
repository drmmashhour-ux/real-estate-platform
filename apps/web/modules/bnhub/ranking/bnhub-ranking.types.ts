/**
 * BNHub stays ranking (V1) — explainable, deterministic scoring.
 */

export type BnhubSortMode =
  | "recommended"
  | "newest"
  | "price_low_high"
  | "price_high_low"
  | "best_value"
  | "top_conversion";

export type BnhubRankingSignalBreakdown = {
  conversionQuality: number;
  listingQuality: number;
  freshness: number;
  priceCompetitiveness: number;
  trustCompleteness: number;
  featuredBoost: number;
  coldStartDampingApplied: boolean;
  /** Small additive lift for recent listings in cold-start traffic (discovery, not compensation for quality). */
  newListingDiscoveryBoost: number;
};

export type BnhubRankingScore = {
  listingId: string;
  finalScore: number;
  signalBreakdown: BnhubRankingSignalBreakdown;
  /** Short, factual lines — only when signals support them */
  explanations: string[];
};

export type BnhubRankingSignals = {
  listingId: string;
  /** Days since publish */
  listingAgeDays: number;
  photoCount: number;
  amenityCount: number;
  descriptionLen: number;
  verified: boolean;
  /** From AiConversionSignal aggregates (window), optional */
  searchViews: number;
  clicks: number;
  listingViews: number;
  bookingStarts: number;
  bookingsCompleted: number;
  ctr: number;
  viewToStartRate: number;
  startToPaidRate: number;
  /** 0–1 host responsiveness proxy when available */
  hostResponsiveness01: number | null;
  /** Night price vs peer median in city (ratio < 1 = cheaper); null if no peers */
  priceVsPeerMedian: number | null;
  /** Peer median night cents in city (same guest band when possible) */
  peerMedianNightCents: number | null;
  peerSampleSize: number;
  /** Synthetic cold-start traffic score 0–1 */
  trafficVolumeScore: number;
};

export type BnhubRankingExplanation = {
  listingId: string;
  lines: string[];
};
