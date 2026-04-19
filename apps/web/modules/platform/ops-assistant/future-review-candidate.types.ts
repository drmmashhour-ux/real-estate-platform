/**
 * Future review candidate registry — backlog only; never activates execution by itself.
 */

export type FutureReviewCandidateStatus =
  | "proposed"
  | "eligible_for_review"
  | "held"
  | "rejected"
  | "archived";

/** How the candidate was grouped for triage — not tied to runtime allowlists. */
export type FutureReviewCandidateCategory =
  | "workflow"
  | "drafting"
  | "triage_tagging"
  | "reminders"
  | "configuration"
  | "other";

/** Human-readable reversibility posture (advisory). */
export type FutureReviewCandidateReversibility = "high" | "medium" | "low" | "unknown";

/**
 * Evidence attached to a candidate — kept as structured text for audit; no machine activation.
 */
export type FutureReviewCandidateEvidenceSummary = {
  /** Primary evidence text (may include trimmed governance / outcome excerpts). */
  narrative: string;
  /** Optional short digest for tables. */
  headline?: string;
};

export type FutureReviewCandidate = {
  id: string;
  /** Action key under discussion — may match a current allowlist id or a proposed adjacent name. */
  actionType: string;
  category: FutureReviewCandidateCategory;
  description: string;
  whyAdjacentLowRisk: string;
  evidenceSummary: FutureReviewCandidateEvidenceSummary;
  auditHealthSummary: string;
  reversibility: FutureReviewCandidateReversibility;
  currentStatus: FutureReviewCandidateStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  /** When present, registry row originated from an accepted low-risk proposal (audit only). */
  sourceProposalId?: string;
};

/** Shown wherever registry data is surfaced to operators. */
export const FUTURE_REVIEW_REGISTRY_NOT_ACTIVE_MESSAGE =
  "Registry entries are not active. Separate approval and implementation are required for any future change.";

export const FUTURE_REVIEW_REGISTRY_BACKLOG_LABEL = "Review backlog only — no automatic enablement.";

/**
 * Architectural rule: nothing in this module enables `APPROVAL_EXECUTABLE_ACTION_KINDS`.
 * Candidates are excluded from approval-execution routing by design — only code edits may widen scope.
 */
export const FUTURE_REVIEW_REGISTRY_CANNOT_ACTIVATE_RULE =
  "Future review candidates are stored out-of-band from execution routing; activation requires an explicit engineering change to the allowlist and ops policy — never this registry.";
