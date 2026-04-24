export type CeoInsightType = "GROWTH" | "REVENUE" | "RISK" | "OPPORTUNITY" | "EFFICIENCY";
export type CeoSeverity = "low" | "medium" | "high";

export interface CeoInsight {
  id: string;
  type: CeoInsightType;
  title: string;
  description: string;
  severity: CeoSeverity;
  detectedAt: Date;
  metadata?: Record<string, any>;
}

export type CeoDecisionType = "INVEST" | "REDUCE" | "EXPERIMENT" | "SHIFT_FOCUS" | "HOLD";
export type CeoDomain = "PRICING" | "MARKETING" | "DEALS" | "ESG" | "PRODUCT";

export interface CeoDecision {
  id: string;
  decisionType: CeoDecisionType;
  domain: CeoDomain;
  payloadJson: Record<string, any>;
  reasoning: string;
  confidence: number; // 0-1
  createdAt: Date;
  insightIds: string[]; // Linked insights
}

export interface CeoStrategySnapshot {
  id: string;
  summaryJson: Record<string, any>;
  keyMetricsJson: Record<string, any>;
  createdAt: Date;
}

export interface CeoContext {
  growth: {
    leadsCount: number;
    conversionRate: number;
    trafficVolume: number;
    trend: number; // Percentage change
  };
  deals: {
    volume: number;
    closeRate: number;
    stageDistribution: Record<string, number>;
    avgRejectionRate: number;
  };
  esg: {
    avgScore: number;
    upgradeActivity: number;
    adoptionRate: number;
  };
  rollout: {
    activeCount: number;
    successRate: number;
    failureSignals: string[];
  };
  agents: {
    decisionsCount: number;
    successSignals: number; // 0-1
    activeAgents: number;
  };
  revenue: {
    total?: number;
    mrr?: number;
    trend?: number;
  };
  timestamp: Date;
}
