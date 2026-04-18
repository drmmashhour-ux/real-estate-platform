/**
 * Host-facing BNHub listing performance — advisory only; no mutations.
 */

import type { BNHubListingScoreBreakdown } from "@/modules/bnhub/ranking/bnhub-ranking.types";

export type BNHubHostListingPerformanceStatus = "weak" | "watch" | "healthy" | "strong";

export type BNHubHostRecommendationCategory =
  | "photos"
  | "amenities"
  | "description"
  | "pricing"
  | "trust"
  | "freshness";

export type BNHubHostRecommendationImpact = "low" | "medium" | "high";

export type BNHubHostRecommendation = {
  id: string;
  category: BNHubHostRecommendationCategory;
  title: string;
  description: string;
  impact: BNHubHostRecommendationImpact;
  why: string;
};

export type BNHubHostListingPerformance = {
  listingId: string;
  listingTitle?: string;
  rankingScore?: number;
  performanceStatus: BNHubHostListingPerformanceStatus;
  scoreBreakdown?: Partial<BNHubListingScoreBreakdown>;
  weakSignals: string[];
  strongSignals: string[];
  rankingExplain?: string[];
  recommendations: BNHubHostRecommendation[];
};

export type BNHubHostPerformanceSummary = {
  hostId?: string;
  listings: BNHubHostListingPerformance[];
  totalListings: number;
  weakListings: number;
  healthyListings: number;
  strongListings: number;
  watchListings: number;
  createdAt: string;
};
