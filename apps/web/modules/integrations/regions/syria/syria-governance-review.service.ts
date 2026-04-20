/**
 * Maps Syria facts + signals → governance review lane.
 * Deterministic; does not persist or trigger workflows — modeling only.
 */
import type { SyriaPreviewPolicyResult } from "./syria-policy.types";
import type { SyriaGovernanceReviewType } from "./syria-governance-review.types";
import type { SyriaSignal } from "./syria-signal.types";

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function isListingPendingReview(raw: unknown): boolean {
  const s = str(raw)?.trim() ?? "";
  if (!s) return false;
  const norm = s.toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return norm === "PENDING_REVIEW";
}

export type ResolveSyriaGovernanceReviewTypeParams = {
  policy: SyriaPreviewPolicyResult;
  facts?: Record<string, unknown>;
  signals?: SyriaSignal[];
};

/**
 * Condition → reviewType (product mapping):
 * - fraudFlag → risk_review
 * - payout issues → risk_review
 * - pending listing → admin_review
 * - otherwise → standard
 *
 * Precedence: fraud → pending admin queue → payout → standard.
 */
export function resolveSyriaGovernanceReviewType(params: ResolveSyriaGovernanceReviewTypeParams): SyriaGovernanceReviewType {
  try {
    const facts = params.facts ?? {};
    const signals = params.signals ?? [];

    if (bool(facts.fraudFlag) === true) return "risk_review";

    if (isListingPendingReview(facts.syriaListingStatus)) return "admin_review";

    if (signals.some((s) => s.type === "payout_anomaly")) return "risk_review";

    return "standard";
  } catch {
    return "standard";
  }
}
