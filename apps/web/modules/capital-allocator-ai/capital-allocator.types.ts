export type ExpectedReturnBand = "LOW" | "MEDIUM" | "HIGH";

export type DealCapitalAllocatorRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/** Normalized inputs (0–1 scales) plus portfolio context — all advisory. */
export type DealCapitalAllocatorInput = {
  dealScore: number;
  riskScore: number;
  closeProbability: number;
  esgScore: number;
  expectedReturnBand: ExpectedReturnBand;
  /** 0 = highly concentrated book; 1 = well spread (see service). */
  diversificationScore: number;
  riskLevel: DealCapitalAllocatorRiskLevel;
  totalDeployableCapitalCents: number;
};

export type DealCapitalAllocatorReasoningJson = {
  version: 1;
  inputs: {
    dealScore: number;
    riskScore: number;
    closeProbability: number;
    esgScore: number;
    expectedReturnBand: ExpectedReturnBand;
    diversificationScore: number;
    riskLevel: DealCapitalAllocatorRiskLevel;
    totalDeployableCapitalCents: number;
  };
  factors: {
    esgAdjustment: number;
    returnAdjustment: number;
    riskAdjustment: number;
    diversificationCap: number;
    qualityFactor: number;
  };
  notes: string[];
};

export type DealCapitalAllocatorResult = {
  allocationPercent: number;
  recommendedAmountCents: number;
  justification: string;
  reasoningJson: DealCapitalAllocatorReasoningJson;
  confidenceScore: number;
};
