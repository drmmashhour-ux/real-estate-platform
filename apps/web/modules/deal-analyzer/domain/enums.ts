/** User-facing recommendation band (maps to DB string). */
export const DealRecommendation = {
  STRONG_OPPORTUNITY: "strong_opportunity",
  WORTH_REVIEWING: "worth_reviewing",
  CAUTION: "caution",
  AVOID: "avoid",
  INSUFFICIENT_DATA: "insufficient_data",
} as const;
export type DealRecommendation = (typeof DealRecommendation)[keyof typeof DealRecommendation];

export const OpportunityType = {
  CASH_FLOW_CANDIDATE: "cash_flow_candidate",
  APPRECIATION_CANDIDATE: "appreciation_candidate",
  VALUE_ADD_CANDIDATE: "value_add_candidate",
  BNHUB_CANDIDATE: "bnhub_candidate",
  OVERPRICED: "overpriced",
  HIGH_RISK: "high_risk",
  INSUFFICIENT_DATA: "insufficient_data",
} as const;
export type OpportunityType = (typeof OpportunityType)[keyof typeof OpportunityType];

export const ConfidenceLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const AnalysisMode = {
  LISTING: "listing",
  INVESTOR: "investor",
  RENTAL: "rental",
  BNHUB: "bnhub",
} as const;
export type AnalysisMode = (typeof AnalysisMode)[keyof typeof AnalysisMode];

export const RiskLevelLabel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;
export type RiskLevelLabel = (typeof RiskLevelLabel)[keyof typeof RiskLevelLabel];
