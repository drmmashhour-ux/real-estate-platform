/**
 * Structured proposals for adjacent low-risk actions — governance/template only; never activates execution.
 */

import type { FutureReviewCandidateCategory } from "./future-review-candidate.types";

export type FutureLowRiskActionProposalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted_to_registry"
  | "rejected"
  | "archived";

/** Advisory summary bundled with each proposal — no runtime enforcement beyond checklist + workflow. */
export type FutureLowRiskActionProposalRiskProfile = {
  headline: string;
  elaboration?: string;
};

/**
 * All items must be true before `submitProposal` succeeds.
 * Deterministic keys — see `CHECKLIST_LABELS` in the service for operator-facing labels.
 */
export type FutureLowRiskActionProposalReviewChecklist = {
  internalOnlyConfirmed: boolean;
  reversibleConfirmed: boolean;
  noPaymentImpact: boolean;
  noBookingCoreImpact: boolean;
  noAdsCoreImpact: boolean;
  noCroCoreImpact: boolean;
  noExternalSendImpact: boolean;
  noLivePricingImpact: boolean;
  adjacentToCurrentLowRiskScope: boolean;
  clearRollbackExists: boolean;
  clearAuditabilityExists: boolean;
};

export type FutureLowRiskActionProposal = {
  id: string;
  title: string;
  proposedActionType: string;
  category: FutureReviewCandidateCategory;
  description: string;
  whyAdjacentToExistingLowRiskScope: string;
  whyReversible: string;
  whyInternalOnly: string;
  expectedOperatorBenefit: string;
  expectedSafetyProfile: string;
  explicitNonGoals: string;
  requiredEvidenceBeforeConsideration: string;
  proposedRollbackMethod: string;
  riskProfile: FutureLowRiskActionProposalRiskProfile;
  reviewChecklist: FutureLowRiskActionProposalReviewChecklist;
  currentStatus: FutureLowRiskActionProposalStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export const PROPOSAL_ACCEPTANCE_NOT_ENABLED_MESSAGE =
  '"Proposal accepted" does not mean "enabled". Acceptance only records the idea in the future-review registry — no execution or allowlist change.';

export const PROPOSALS_CANNOT_ACTIVATE_RULE =
  "Low-risk proposals are documents and workflow state only. They cannot call execution, modify APPROVAL_EXECUTABLE_ACTION_KINDS, alter rollout flags, or bypass governance — only explicit engineering changes can do that.";
