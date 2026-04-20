export type RecommendationType = "buy" | "sell" | "optimize" | "hold" | "watch";

export type RecommendationReason = {
  label: string;
  message: string;
  impact: "positive" | "negative" | "neutral";
};

export type RecommendationRisk = {
  severity: "low" | "medium" | "high";
  message: string;
};

export type RecommendationAction = {
  priority: "low" | "medium" | "high";
  message: string;
};

export type RecommendationMetrics = {
  listingId: string;
  listingTitle?: string | null;
  /** Human-readable note on how metrics were sourced (audit). */
  dataNote?: string | null;
  grossRevenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  bookingCount: number;
  roiAnnualized?: number | null;
  costCoverageRatio?: number | null;
  revenueTrend?: number | null;
  occupancyTrend?: number | null;
  /** Indicates whether listing had optional underwriting fields populated (confidence / risks reference these). */
  purchasePriceRecorded?: boolean;
  estimatedValueRecorded?: boolean;
  operatingCostRecorded?: boolean;
};

export type RecommendationResult = {
  recommendation: RecommendationType;
  confidenceScore: number;
  score: number;
  reasons: RecommendationReason[];
  risks: RecommendationRisk[];
  actions: RecommendationAction[];
  metrics: RecommendationMetrics;
};
