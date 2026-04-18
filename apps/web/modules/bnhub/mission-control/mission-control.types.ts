/**
 * BNHub Mission Control V1 — read-only operational snapshot (advisory).
 */

export type BNHubMissionControlStatus = "weak" | "watch" | "healthy" | "strong";

export type BNHubMissionControlRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  why: string;
};

export type BNHubMissionControlSummary = {
  listingId?: string;
  /** Cross-surface rollup status. */
  status?: BNHubMissionControlStatus;
  rankingScore?: number;
  hostStatus?: string;
  guestConversionStatus?: string;
  bookingHealth?: string;
  trustScore?: number;
  pricingSignal?: string;
  weakSignals: string[];
  strongSignals: string[];
  topRisks: string[];
  topOpportunities: string[];
  recommendations: BNHubMissionControlRecommendation[];
  createdAt: string;
};

/** Internal aggregate before analysis (no writes). */
export type BNHubMissionControlRawSnapshot = {
  listingId: string;
  listingTitle: string | null;
  createdAt: string;
  rankingFinalScore?: number;
  rankingBreakdown?: import("@/modules/bnhub/ranking/bnhub-ranking.types").BNHubListingScoreBreakdown;
  rankingWhy?: string[];
  hostListingStatus: string;
  hostWeakSignals: string[];
  hostStrongSignals: string[];
  guestConversionStatus: string;
  guestConversionWeakSignals: string[];
  guestMetrics?: {
    listingViews?: number;
    bookingStarts?: number;
    bookingCompletions?: number;
    viewToStartRate?: number;
    startToBookingRate?: number;
  };
  bookingHealth: string;
  trustScoreBreakdown?: number;
  reviewCount: number;
  pricingSignalLabel: string;
  dataNotes: string[];
};
