export type AllocationStrategyMode = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE" | "ESG_FOCUSED";

export interface DealAllocationInput {
  dealId: string;
  title: string;
  underwritingScore: number; // 0-1
  esgScore: number; // 0-1
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  financingAvailability: number; // 0-1
  complianceScore: number; // 0-1
  dealStage: string; // e.g., "SCREENING", "DILIGENCE", "COMMITMENT"
  region: string;
  status: string;
}

export interface AllocationConstraints {
  maxPerDealPercent: number; // e.g., 0.25 (25%)
  maxPerRegionPercent: number; // e.g., 0.4 (40%)
  maxRiskExposure: "LOW" | "MEDIUM" | "HIGH";
  minDiversificationCount: number;
}

export interface CapitalAllocationInput {
  deals: DealAllocationInput[];
  totalCapitalAvailable: number;
  strategyMode: AllocationStrategyMode;
  constraints: AllocationConstraints;
}

export interface CapitalAllocationDecision {
  dealId: string;
  title: string;
  allocatedAmount: number;
  allocationPercent: number;
  normalizedScore: number;
  rationale: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  esgImpact: string;
  expectedOutcome: string;
}

export interface CapitalAllocationPlan {
  totalCapital: number;
  allocatedCapital: number;
  availableCapital: number;
  strategyMode: AllocationStrategyMode;
  allocations: CapitalAllocationDecision[];
  summary: string;
  diversificationScore: number; // 0-1
  riskScore: number; // 0-1
}
