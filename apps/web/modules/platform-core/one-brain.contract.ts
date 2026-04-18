/**
 * One Brain System V1/V2 — unified decision contract (all intelligence flows through Platform Core).
 * LECIPM PLATFORM — adaptive weights (V2) refine trust; they never replace approvals or safety blockers.
 */
export type BrainDecisionInput = {
  source: "ADS" | "CRO" | "RETARGETING" | "AB_TEST" | "PROFIT" | "MARKETPLACE" | "UNIFIED" | "OPERATOR";
  entityType: "CAMPAIGN" | "LISTING" | "EXPERIMENT" | "VARIANT" | "MESSAGE" | "SURFACE" | "UNKNOWN";
  entityId?: string | null;
  actionType: string;
  confidenceScore: number;
  evidenceScore?: number | null;
  learningSignals?: string[];
  geo?: Record<string, number>;
  reason: string;
  expectedImpact?: string | null;
  warnings?: string[];
  blockers?: string[];
  /** One Brain V2 — persisted adaptive multiplier for this source (1.0 when disabled / unknown). */
  sourceWeight?: number | null;
};

export type BrainDecisionOutput = {
  trustScore: number;
  baseTrustScore: number;
  sourceWeightApplied: number;
  executionPriority: number;
  rankingImpact: number;
  executionAllowed: boolean;
  reasoning: string;
  adaptationReason: string;
};
