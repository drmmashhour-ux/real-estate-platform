/**
 * Evidence-based low-risk allowlist expansion — governance only; never widens risky domains.
 */

import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";
import type { GrowthAutonomyTrialDecision } from "./growth-autonomy-trial-results.types";

export type { ExpansionPendingProposal, ExpansionTrialActivation } from "./growth-autonomy-expansion.repository";

export type GrowthAutonomyExpansionStatus =
  | "not_eligible"
  | "insufficient_data"
  | "eligible_for_trial"
  | "approved_for_internal_expansion"
  | "hold"
  | "rollback_candidate";

export type GrowthAutonomyExpansionDecision =
  | "hold_scope"
  | "propose_internal_trial"
  | "approve_internal_expansion"
  | "flag_rollback"
  | "requires_manual_review";

export type GrowthAutonomyExpansionOutcome = {
  candidateId: string;
  decision: GrowthAutonomyExpansionDecision;
  status: GrowthAutonomyExpansionStatus;
  explanation: string;
};

/** Observable metrics for one low-risk action pattern (by action key). */
export type GrowthAutonomyExpansionEvidence = {
  lowRiskActionKey: GrowthAutonomyLowRiskActionKey | string;
  /** Currently on production allowlist via catalog mapping. */
  onAllowlist: boolean;
  /** Distinct catalog ids using this action key */
  catalogEntryIds: string[];
  sampleSizeExecuted: number;
  sampleSizeUndone: number;
  undoRate: number;
  downgradeApproxCount: number;
  learningHelpfulYes: number;
  learningHelpfulNo: number;
  learningSparse: boolean;
  positiveFeedbackRate?: number;
  auditRowsComplete: number;
  auditRowsIncomplete: number;
  observationWindowDays: number;
};

export type GrowthAutonomyExpansionCandidate = {
  /** Stable id e.g. `adjacent:prefill_growth_script:v1` */
  id: string;
  parentActionKey: GrowthAutonomyLowRiskActionKey;
  proposedActionKey: GrowthAutonomyLowRiskActionKey | string;
  label: string;
  /** Narrow adjacency — must pass boundaries helper */
  adjacencyKind: "internal_draft_variant" | "group_similar_tasks" | "broader_internal_tag" | "related_prefill";
  reversibility: "reversible_internal" | "none";
};

export type GrowthAutonomyExpansionEvidenceSummary = {
  candidateId: string;
  parentEvidence: GrowthAutonomyExpansionEvidence;
  generatedAt: string;
};

/** Snapshot of audit-quality gate (duplicated shape to avoid type↔service cycles). */
export type GrowthAutonomyAuditHealthSnapshot = {
  healthy: boolean;
  reasons: string[];
  rowCountWindow: number;
  distinctActionKeys: number;
  explanationIntegritySample: {
    sampled: number;
    withSubstantiveExplanation: number;
  };
};

export type GrowthAutonomyExpansionReport = {
  generatedAt: string;
  expansionFeatureOn: boolean;
  expansionPanelOn: boolean;
  expansionFreezeFlag: boolean;
  auditHealth: GrowthAutonomyAuditHealthSnapshot;
  /** One row per allowlisted parent action key. */
  parentOutcomes: Array<{
    evidence: GrowthAutonomyExpansionEvidence;
    status: GrowthAutonomyExpansionStatus;
    decision: GrowthAutonomyExpansionDecision;
    explanation: string;
  }>;
  /** Adjacent expansion candidates (never auto-activated). */
  candidateOutcomes: Array<{
    candidate: GrowthAutonomyExpansionCandidate;
    parentEvidence: GrowthAutonomyExpansionEvidence;
    status: GrowthAutonomyExpansionStatus;
    decision: GrowthAutonomyExpansionDecision;
    explanation: string;
  }>;
  pending: ExpansionPendingProposal[];
  activatedTrials: ExpansionTrialActivation[];
  /** Present when adjacent internal trial flags may interact with expansion governance. */
  adjacentTrialGovernanceLock?: {
    blocksExpansionApprovals: boolean;
    reason: string;
    trialMeasurementReady: boolean;
    trialOutcomeDecision: GrowthAutonomyTrialDecision | null;
  };
};
