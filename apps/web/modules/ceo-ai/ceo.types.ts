export type CeoInsightType = "GROWTH" | "REVENUE" | "RISK" | "OPPORTUNITY" | "EFFICIENCY";
export type CeoInsightSeverity = "low" | "medium" | "high";

export interface CeoInsight {
  id: string;
  type: CeoInsightType;
  title: string;
  description: string;
  severity: CeoInsightSeverity;
  detectedAt: Date;
}

export type CeoDecisionType = "INVEST" | "REDUCE" | "EXPERIMENT" | "SHIFT_FOCUS" | "HOLD";
export type CeoDecisionDomain = "PRICING" | "MARKETING" | "DEALS" | "ESG" | "PRODUCT" | "GROWTH" | "OUTREACH" | "RETENTION" | "OPERATIONS" | "FUND" | "CAPITAL";

export interface CeoDecision {
  id: string;
  decisionType: CeoDecisionType;
  domain: CeoDecisionDomain;
  payloadJson: any;
  reasoning: string;
  confidence: number;
  createdAt: Date;
}

export interface CeoStrategySnapshot {
  id: string;
  summaryJson: any;
  keyMetricsJson: any;
  createdAt: Date;
}

export interface CeoContext {
  growth: {
    leads: number;
    leadsPrev: number;
    conversionRate: number;
    traffic: number;
  };
  deals: {
    volume: number;
    closeRate: number;
    stageDistribution: Record<string, number>;
  };
  esg: {
    avgScore: number;
    upgradeActivity: number;
  };
  rollout: {
    activeRollouts: number;
    successRate: number;
  };
  agents: {
    decisionsCount: number;
    successSignals: number;
  };
  revenue?: {
    mrr: number;
    growth: number;
  };
}
