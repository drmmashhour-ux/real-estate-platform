/**
 * Autonomous AI Property Manager – shared types and agent output shapes.
 */

export const AGENT_TYPES = [
  "property_performance",
  "dynamic_pricing",
  "occupancy",
  "listing_quality",
  "fraud_risk",
  "service_quality",
  "portfolio",
  "investment",
  "support",
  "market_shift",
] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export const ENTITY_TYPES = ["property", "listing", "user", "portfolio"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface ExplainableOutput {
  confidenceScore: number; // 0-100
  reasonSummary: string;
  contributingFactors: string[];
  humanReviewRequired: boolean;
  timestamp: string;
}

export interface PropertyPerformanceOutput extends ExplainableOutput {
  propertyPerformanceScore: number;
  trendDirection: "up" | "down" | "stable";
  strengths: string[];
  weaknesses: string[];
  recommendedActions: string[];
}

export interface PricingRecommendationOutput extends ExplainableOutput {
  recommendedSalePriceRange?: { min: number; max: number }; // cents
  recommendedRentRange?: { min: number; max: number }; // cents/month
  recommendedNightlyCents?: number;
  minStaySuggestion?: number;
  discountStrategySuggestion?: string;
  reasonSummary: string;
}

export interface OccupancyOutput extends ExplainableOutput {
  occupancyOptimizationScore: number;
  gapFillSuggestions: string[];
  suggestedOpenDates?: string[];
  suggestedSpecialOffers?: string[];
  expectedOccupancyUplift?: number; // percentage points
}

export interface ListingQualityOutput extends ExplainableOutput {
  listingQualityScore: number;
  missingInfoWarnings: string[];
  titleImprovements?: string[];
  descriptionImprovements?: string[];
  photoSuggestions?: string[];
  amenitySuggestions?: string[];
}

export interface RiskOutput extends ExplainableOutput {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  propertyRiskSummary: string;
  recommendedAction: string;
  reviewPriority: "low" | "medium" | "high";
}

export interface ServiceQualityOutput extends ExplainableOutput {
  serviceQualityScore: number;
  trend: "up" | "down" | "stable";
  issueClusters: string[];
  hostImprovementSuggestions: string[];
  escalationRecommendation?: string;
}

export interface PortfolioOutput extends ExplainableOutput {
  portfolioPerformanceScore: number;
  topPerformingProperties: string[];
  underperformingProperties: string[];
  concentrationRiskWarnings: string[];
  suggestedActionsByProperty: Record<string, string[]>;
}

export interface InvestmentOutput extends ExplainableOutput {
  investmentAttractivenessScore: number;
  opportunityLabel: string;
  valueAddSuggestions: string[];
  yieldEstimate?: number;
  riskLevel: string;
}

export interface SupportTriageOutput extends ExplainableOutput {
  issueCategory: string;
  severity: string;
  urgencyScore: number;
  nextStepSuggestion: string;
  escalationRecommendation?: string;
}

export interface MarketShiftOutput extends ExplainableOutput {
  marketShiftAlerts: string[];
  emergingOpportunityAlerts: string[];
  riskZoneWarnings: string[];
  strategySuggestions: string[];
}
