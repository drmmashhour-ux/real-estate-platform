/**
 * Growth Engine V2 — unified read-only operating snapshot (no mutations, no fabricated KPIs).
 */

export type GrowthHealthBand = "strong" | "ok" | "watch" | "insufficient_data";

export type GrowthOpportunityCategory =
  | "traffic"
  | "conversion"
  | "revenue"
  | "broker"
  | "bnhub"
  | "retention"
  | "ops";

export type GrowthSeverity = "low" | "medium" | "high";

export type GrowthConfidence = "low" | "medium" | "high";

export type GrowthOpportunity = {
  id: string;
  category: GrowthOpportunityCategory;
  title: string;
  description: string;
  urgency: GrowthSeverity;
  impact: GrowthSeverity;
  confidence: GrowthConfidence;
  recommendedAction: string;
  sourceSignals: string[];
};

export type GrowthRisk = {
  id: string;
  category: GrowthOpportunityCategory;
  title: string;
  description: string;
  severity: GrowthSeverity;
  recommendedResponse: string;
  sourceSignals: string[];
};

export type GrowthActionOwnerArea = "growth" | "broker" | "revenue" | "bnhub" | "product" | "ops";

export type GrowthActionType =
  | "review"
  | "navigate"
  | "draft"
  | "fix_followup"
  | "improve_conversion"
  | "push_supply";

export type GrowthAction = {
  id: string;
  category: GrowthOpportunityCategory;
  title: string;
  description: string;
  ownerArea: GrowthActionOwnerArea;
  /** Deterministic composite for ordering — higher = sooner */
  priorityScore: number;
  /** UI route hint — informational */
  targetSurface: string;
  actionType: GrowthActionType;
  horizon: "today" | "week";
  sourceSignals: string[];
};

export type GrowthEngineV2Summary = {
  trafficHealth: GrowthHealthBand;
  conversionHealth: GrowthHealthBand;
  revenueHealth: GrowthHealthBand;
  brokerHealth: GrowthHealthBand;
  bnhubHealth: GrowthHealthBand;
  platformHealth: GrowthHealthBand;
  topOpportunities: GrowthOpportunity[];
  topRisks: GrowthRisk[];
  /** Top 3 focus items for today */
  topActions: GrowthAction[];
  /** Up to 5 broader items for the week */
  weeklyActions: GrowthAction[];
  dataQualityNotes: string[];
  generatedAt: string;
};
