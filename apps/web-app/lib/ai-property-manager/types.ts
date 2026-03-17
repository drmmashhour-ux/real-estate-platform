/**
 * Autonomous AI Property Manager – shared types and agent outputs.
 */

export const AGENT_TYPES = [
  "performance",
  "pricing",
  "occupancy",
  "listing_quality",
  "risk",
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
  recommendedNextActions: string[];
}

export interface PricingRecommendationOutput extends ExplainableOutput {
  recommendedSalePriceMin?: number; // cents
  recommendedSalePriceMax?: number;
  recommendedRentMonthlyMin?: number;
  recommendedRentMonthlyMax?: number;
  recommendedNightlyPrice?: number; // cents
  minStaySuggestion?: number;
  discountStrategySuggestion?: string;
}

export interface OccupancyOptimizationOutput extends ExplainableOutput {
  occupancyOptimizationScore: number;
  gapFillSuggestions: string[];
  dateSpecificRecommendations: Array<{ date: string; suggestion: string }>;
  suggestedOpenDates: string[];
  suggestedSpecialOffers: string[];
  expectedOccupancyUplift?: number; // percent
}

export interface ListingQualityOutput extends ExplainableOutput {
  listingQualityScore: number;
  missingInformationWarnings: string[];
  titleImprovements: string[];
  descriptionImprovements: string[];
  photoSuggestions: string[];
  amenitySuggestions: string[];
  trustSuggestions: string[];
}

export interface RiskEvaluationOutput extends ExplainableOutput {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  propertyRiskSummary: string;
  actorRiskSummary?: string;
  recommendedAction: string;
  reviewPriority: "low" | "normal" | "high" | "urgent";
}

export interface ServiceQualityOutput extends ExplainableOutput {
  serviceQualityScore: number;
  serviceQualityTrend: "up" | "down" | "stable";
  issueClusters: string[];
  hostImprovementSuggestions: string[];
  escalationRecommendation: boolean;
}

export interface PortfolioIntelligenceOutput extends ExplainableOutput {
  portfolioPerformanceScore: number;
  topPerformingProperties: string[];
  underperformingProperties: string[];
  concentrationRiskWarnings: string[];
  suggestedActionsByProperty: Array<{ entityId: string; action: string }>;
  revenueOptimizationIdeas: string[];
}

export interface InvestmentOpportunityOutput extends ExplainableOutput {
  investmentAttractivenessScore: number;
  opportunityLabel: string;
  valueAddSuggestions: string[];
  yieldEstimate?: number;
  riskLevel: string;
  comparableRationale: string;
}

export interface SupportTriageOutput extends ExplainableOutput {
  issueCategory: string;
  severity: string;
  urgencyScore: number;
  nextStepSuggestion: string;
  escalationRecommendation: boolean;
}

export interface MarketShiftOutput extends ExplainableOutput {
  marketShiftAlerts: string[];
  emergingOpportunityAlerts: string[];
  riskZoneWarnings: string[];
  strategySuggestions: string[];
}
