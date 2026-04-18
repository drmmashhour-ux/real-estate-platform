export type StrategyInsightType =
  | "growth"
  | "bottleneck"
  | "financial_risk"
  | "broker_productivity"
  | "listing_performance"
  | "closing_acceleration";

export type StrategyInsightImpact = "low" | "medium" | "high";
export type StrategyInsightUrgency = "low" | "medium" | "high";

export type StrategyInsight = {
  type: StrategyInsightType;
  title: string;
  summary: string;
  impactLevel: StrategyInsightImpact;
  urgency: StrategyInsightUrgency;
  reasons: string[];
  suggestedActions: string[];
  affectedArea: string;
  ownerReviewRequired: true;
};

export type StrategyBoardPayload = {
  generatedAt: string;
  insights: StrategyInsight[];
  disclaimer: string;
};
