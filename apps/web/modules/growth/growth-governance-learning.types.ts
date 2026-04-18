/**
 * Governance + learning control — advisory states only (no automatic enforcement).
 */

export type GrowthLearningControlState = "normal" | "monitor" | "freeze_recommended" | "reset_recommended";

export type GrowthLearningControlReason = {
  code: string;
  message: string;
};

export type GrowthLearningControlDecision = {
  state: GrowthLearningControlState;
  reasons: GrowthLearningControlReason[];
  confidence: number;
  recommendedActions: string[];
  observedSignals: {
    negativeRate?: number;
    insufficientDataRate?: number;
    weightDrift?: number;
    governanceRisk?: string;
    executionErrors?: number;
  };
  createdAt: string;
};
