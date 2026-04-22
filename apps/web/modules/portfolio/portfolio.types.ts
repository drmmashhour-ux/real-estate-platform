export type PortfolioDecisionType = "INVEST" | "HOLD" | "OPTIMIZE" | "EXIT";

export type DecisionStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "EXECUTED";

export type HealthBand = "A" | "B" | "C" | "D";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type PerformanceLevel = "STRONG" | "STABLE" | "WEAK";

export type AllocationRow = {
  assetId: string;
  assetName: string;
  proposedAmount: number;
  weight: number;
  basis: string;
};
