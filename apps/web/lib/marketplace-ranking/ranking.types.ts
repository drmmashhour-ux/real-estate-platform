/**
 * Marketplace listing ranking — typed inputs for explainable search/feed ordering.
 */

export type RankingMarketSegment = "BUY" | "RENT" | "SHORT_TERM";

export type RankingSortIntent = "RELEVANCE" | "PRICE" | "NEWEST";

export type RankingContext = {
  userId?: string | null;
  searchQuery?: string | null;
  filtersJson: Record<string, unknown>;
  mapBoundsJson?: Record<string, unknown> | null;
  marketSegment: RankingMarketSegment;
  sortIntent: RankingSortIntent;
};

/** Per-listing signals in 0–1 unless noted; all surfaced in breakdown for audit/UI. */
export type ListingRankingSignals = {
  listingId: string;
  priceFitScore: number;
  locationFitScore: number;
  propertyMatchScore: number;
  freshnessScore: number;
  qualityScore: number;
  trustScore: number;
  engagementScore: number;
  responseSpeedScore: number;
  closeProbabilityScore: number;
  bookingProbabilityScore: number;
  esgBonusScore: number;
  premiumBoostScore: number;
};

export type ListingRankingPenaltyReason =
  | "incomplete_profile"
  | "low_host_responsiveness"
  | "verification_rejected"
  | "duplicate_suspected"
  | "compliance_flag"
  | "unavailable_for_dates";

export type ListingRankingBreakdown = {
  weightsVersion: string;
  cohort?: string | null;
  /** Blended location + query relevance (0–1), same weight as `relevance` in the engine. */
  relevanceComposite?: number;
  weightedSubtotal: number;
  personalizationBoost: number;
  penaltyMultiplier: number;
  penalties: ListingRankingPenaltyReason[];
  premiumAdditive: number;
  /** 0–100 scale */
  totalScore: number;
  signals: ListingRankingSignals;
  explain: string[];
  excluded: boolean;
  exclusionReason?: string;
};
