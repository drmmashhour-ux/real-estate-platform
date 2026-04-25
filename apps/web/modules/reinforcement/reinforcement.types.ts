import type { StrategyBenchmarkDomain } from "@prisma/client";

/**
 * Product-context input for bucket hashing — no PII, coarse bands only.
 */
export type ReinforcementContextInput = {
  dealStage?: string | null;
  /** 0–1 or label-derived */
  closingReadinessBand?: "low" | "mid" | "high" | "unknown";
  offerReadinessBand?: "low" | "mid" | "high" | "unknown";
  financingReadiness?: "unknown" | "weak" | "medium" | "strong";
  urgency?: "low" | "medium" | "high" | "unknown";
  /** Max objection severity in view */
  objectionSeverity?: "none" | "low" | "medium" | "high" | "unknown";
  competitionRisk?: "low" | "medium" | "high" | "unknown";
  visitCompleted?: boolean | null;
  silenceGapBand?: "low" | "mid" | "high" | "unknown";
  engagementBand?: "low" | "mid" | "high" | "unknown";
};

export type ReinforcementCandidate = {
  strategyKey: string;
  /** 0–1 from parent engine */
  baseScore: number;
  /** If true, never selected */
  blocked?: boolean;
  rationale?: string[];
};

export type SelectStrategyWithReinforcementParams = {
  domain: StrategyBenchmarkDomain;
  candidates: ReinforcementCandidate[];
  context: ReinforcementContextInput;
  dealId?: string | null;
  conversationId?: string | null;
  brokerId?: string | null;
};
