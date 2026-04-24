import type {
  LecipmDisputeCaseCategory,
  LecipmDisputeCaseEntityType,
  LecipmDisputePredictedCategory,
  LecipmPreDisputeRiskLevel,
} from "@prisma/client";

import type { RiskSignal } from "@/modules/risk-engine/risk.types";

export type DisputePredictionSourceMix =
  | "rules_only"
  | "patterns_only"
  | "rules_plus_patterns";

export type DisputePredictionContext = {
  entityType: LecipmDisputeCaseEntityType;
  entityId: string;
  signals: RiskSignal[];
  /** Directional counts — not fault attribution. */
  relatedDisputeCounts: {
    sameEntityPast180d: number;
    listingScopedPast180d?: number;
  };
  listingId?: string | null;
  brokerId?: string | null;
  metadata: Record<string, unknown>;
};

export type DisputePredictionResult = {
  disputeRiskScore: number;
  riskBand: LecipmPreDisputeRiskLevel;
  predictedCategory: LecipmDisputePredictedCategory;
  topContributingSignals: Array<{
    id: string;
    weight: number;
    source: string;
    evidence: string;
  }>;
  suggestedPreventionActions: Array<{ kind: string; detail: string }>;
  matchedPatternKeys: string[];
  sourceMix: DisputePredictionSourceMix;
  engineVersion: string;
};

export type DisputePredictionExplainabilityPayload = {
  topContributingSignals: DisputePredictionResult["topContributingSignals"];
  whyElevated: string[];
  recommendedActions: string[];
  confidenceNote: string;
  patternLearningNote: string;
  safetyFooter: string;
};

export type PriorDisputePredictionAttachment = {
  snapshotAt: string | null;
  disputeRiskScore: number | null;
  riskBand: LecipmPreDisputeRiskLevel | null;
  predictedCategory: LecipmDisputePredictedCategory | null;
  preventionActionsSummary: string[];
  categoryMatchWithActual:
    | "aligned"
    | "partial"
    | "unknown"
    | "no_prior_snapshot";
  actualDisputeCategory?: LecipmDisputeCaseCategory;
};
