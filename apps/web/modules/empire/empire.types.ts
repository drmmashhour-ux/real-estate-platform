// Temporary manual definitions until prisma generate succeeds
export type EmpireEntityType = "HOLDING" | "OPERATING" | "INVESTMENT" | "SERVICE";
export type EmpireRoleType = "FOUNDER" | "MANAGER" | "BOARD" | "OPERATOR" | "ADVISOR";

export interface EmpireOverview {
  totalEntities: number;
  activeEntities: number;
  totalCapitalRollup: number;
  majorRisksCount: number;
}

export interface EntityPerformance {
  entityId: string;
  name: string;
  type: EmpireEntityType;
  revenue: number;
  growth: number;
  burn: number;
  activeUsers: number;
  status: "STRONG" | "STABLE" | "WEAK" | "CRITICAL";
  strategicScore: number; // 0-100
}

export interface CapitalSummary {
  entityId: string;
  entityName: string;
  totalCapital: number;
  reserves: number;
  operatingAllocation: number;
  investmentAllocation: number;
  currency: string;
}

export interface GovernanceAlert {
  id: string;
  entityId: string;
  entityName: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type: string;
  message: string;
  createdAt: Date;
}

export interface StrategicRecommendation {
  entityId: string;
  entityName: string;
  action: "INCREASE_CAPITAL" | "REDUCE_SPEND" | "HOLD_RESERVES" | "INCUBATE" | "SHUT_DOWN" | "PAUSE";
  priority: number; // 1-10
  rationale: string;
  confidence: number; // 0-1
  riskNotes: string;
}

export interface EmpireOrchestrationPriority {
  entityId: string;
  entityName: string;
  priorityType: "CAPITAL" | "HIRING" | "ATTENTION" | "EXPANSION";
  rank: number;
  rationale: string;
  tradeoffs: string;
}
