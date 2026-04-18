export type BnhubDemandLevel = "low" | "medium" | "high";

export type BnhubPricingBand = {
  minCents: number;
  maxCents: number;
};

export type BnhubPricingExplanation = {
  summary: string;
  lines: string[];
};

export type BnhubPricingSignals = {
  currentNightCents: number;
  marketAvgCents: number | null;
  peerListingCount: number;
  demandLevel: BnhubDemandLevel;
  /** Funnel: views, starts, completions in window (if conversion layer has data) */
  listingViews: number;
  bookingStarts: number;
  bookingsCompleted: number;
  viewToStartRate: number;
  startToPaidRate: number;
  qualityScore01: number | null;
  dataSparse: boolean;
};

export type BnhubAdvisoryPricingReasonCode =
  | "PEER_ANCHOR"
  | "DEMAND_STRONG"
  | "CONVERSION_FRICTION"
  | "SPARSE_TRAFFIC"
  | "HOLD_STEADY"
  | "MILD_INCREASE"
  | "MILD_DECREASE";

export type BnhubAdvisoryPricingSuggestion = {
  listingId: string;
  currentPriceCents: number;
  suggestedPriceCents: number;
  minRecommendedCents: number;
  maxRecommendedCents: number;
  band: BnhubPricingBand;
  demandLevel: BnhubDemandLevel;
  confidence: number;
  confidenceLabel: "low" | "medium" | "high";
  explanation: BnhubPricingExplanation;
  reasonCodes: BnhubAdvisoryPricingReasonCode[];
  noChangeRecommended: boolean;
};
