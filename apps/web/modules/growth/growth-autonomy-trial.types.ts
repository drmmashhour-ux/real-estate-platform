/**
 * Operator-approved internal trial — single adjacent low-risk action only (bounded).
 * No customer-facing execution; audit-first; reversible.
 */

import type { GrowthEnforcementMode } from "./growth-policy-enforcement.types";

/** Eligibility outcome from conservative gates + evidence. */
export type GrowthAutonomyTrialEligibilityOutcome =
  | "not_eligible"
  | "insufficient_data"
  | "eligible_for_internal_trial"
  | "hold"
  | "rollback_candidate";

/** The only adjacent internal trial action allowed in this phase (see boundaries module). */
export type GrowthAutonomyAdjacentTrialActionType = "internal_review_note_variant";

export type GrowthAutonomyTrialActivationStatus =
  | "proposed"
  | "approved_internal_trial"
  | "active"
  | "rolled_back"
  | "expired"
  | "denied";

export type GrowthAutonomyTrialRollbackStatus = "none" | "pending" | "completed";

/** Evidence-backed candidate before approval. */
export type GrowthAutonomyTrialCandidateAction = {
  id: string;
  target: string;
  actionType: GrowthAutonomyAdjacentTrialActionType;
  category: "adjacent_internal_trial";
  explanation: string;
  confidence: number;
  enforcementResult: { mode: GrowthEnforcementMode; rationale: string };
  allowedReason: string;
  disallowedReason: string | null;
  reversibility: string;
  baselineAllowlisted: false;
  trialBased: true;
  evidenceQualityScore: number;
};

export type GrowthAutonomyTrialApprovalRecord = {
  trialActionId: string;
  candidateActionType: GrowthAutonomyAdjacentTrialActionType;
  evidenceSummary: string;
  approvedBy: string | null;
  approvedAt: string | null;
  activationStatus: GrowthAutonomyTrialActivationStatus;
  rollbackStatus: GrowthAutonomyTrialRollbackStatus;
  notes: string | null;
  /** Set when execution ran — links audit trail. */
  executionArtifactId: string | null;
};

export type GrowthAutonomyTrialExplanation = {
  whyEligibleOrNot: string;
  evidenceSummary: string;
  auditHealthSummary: string;
  policyGateSummary: string;
};

/** Embedded in GrowthAutonomySnapshot when trial module is wired. */
export type GrowthAutonomyTrialSnapshot = {
  trialLayerEnabled: boolean;
  trialFreezeActive: boolean;
  rolloutAllowsTrialActivation: boolean;
  autonomyModeAllowsTrial: boolean;
  eligibilityOutcome: GrowthAutonomyTrialEligibilityOutcome;
  explanation: GrowthAutonomyTrialExplanation;
  selectedCandidate: GrowthAutonomyTrialCandidateAction | null;
  holdCandidates: GrowthAutonomyTrialCandidateAction[];
  approval: GrowthAutonomyTrialApprovalRecord | null;
  activationBlockedReason: string | null;
  operatorNotes: string[];
};
