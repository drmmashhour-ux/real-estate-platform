/**
 * Deterministic operator-facing lines — trust + clarity; no LLM.
 */
import type { SyriaApprovalBoundaryResult } from "./syria-approval-boundary.types";
import type { SyriaGovernanceReviewType } from "./syria-governance-review.types";
import type { SyriaPreviewPolicyDecision } from "./syria-policy.types";

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

export function buildSyriaGovernanceExplainabilityLines(params: {
  policyDecision: SyriaPreviewPolicyDecision;
  reviewType: SyriaGovernanceReviewType;
  boundary: SyriaApprovalBoundaryResult;
  facts?: Record<string, unknown>;
  hasPayoutSignal?: boolean;
}): readonly string[] {
  const lines: string[] = [];

  lines.push("Execution is unavailable for the Syria region in this phase.");

  if (params.policyDecision === "blocked_for_region") {
    lines.push("This Syria listing cannot be previewed under current regional capability gates.");
    return lines;
  }

  if (params.boundary.requiresHumanApprovalHint) {
    lines.push("This Syria listing is previewable but requires local approval before any automation.");
  }

  const facts = params.facts ?? {};

  if (bool(facts.fraudFlag) === true) {
    lines.push("Fraud flag requires local admin review.");
  } else if (params.hasPayoutSignal === true) {
    lines.push("Payout inconsistency signals require risk review before operational reliance.");
  }

  if (params.reviewType === "admin_review") {
    lines.push("Pending listing status maps to admin_review governance lane (modeled only; no execution).");
  }

  return lines;
}
