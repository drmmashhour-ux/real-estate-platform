export const PortfolioMonitoringEventType = {
  OPPORTUNITY_UPGRADED: "opportunity_upgraded",
  OPPORTUNITY_DOWNGRADED: "opportunity_downgraded",
  TRUST_DROPPED: "trust_dropped",
  COMPARABLES_SHIFTED: "comparables_shifted",
  SCENARIO_WEAKENED: "scenario_weakened",
  BNHUB_OUTLOOK_CHANGED: "bnhub_outlook_changed",
  REPRICING_REVIEW_RECOMMENDED: "repricing_review_recommended",
} as const;

export type PortfolioMonitoringSummaryCore = {
  watchlistId: string;
  evaluatedAt: string;
  upgradedCount: number;
  downgradedCount: number;
  trustDroppedCount: number;
  repricingRecommendedCount: number;
  biggestMovers: { propertyId: string; deltaScore: number }[];
  confidence: "low" | "medium" | "high";
  warnings: string[];
};
