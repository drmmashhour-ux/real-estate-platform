import type { SyriaPreviewPolicyDecision } from "./syria-policy.types";

/**
 * Syria governance review classification — modeled only in apps/web (no execution, no Syria-app persistence).
 */
export type SyriaGovernanceReviewType =
  /** Fraud / payout-risk posture — escalate to risk-oriented review. */
  | "risk_review"
  /** Listing queue / moderation — admin-oriented review. */
  | "admin_review"
  /** Default preview posture — no elevated review lane implied by Syria signals alone. */
  | "standard";

/** Policy + governance lane label — does not execute workflows. */
export type SyriaPreviewPolicyDecisionEnvelope = {
  decision: SyriaPreviewPolicyDecision;
  rationale: string;
  reviewType: SyriaGovernanceReviewType;
};
