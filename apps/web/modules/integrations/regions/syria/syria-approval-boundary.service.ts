/**
 * Maps Syria preview policy outcomes to execution / approval boundaries.
 * Deterministic; no side effects; never throws.
 */
import type { SyriaPreviewPolicyResult } from "./syria-policy.types";
import type { SyriaApprovalBoundaryReason, SyriaApprovalBoundaryResult } from "./syria-approval-boundary.types";

const BASE_NOTES = [
  "Syria region adapter in apps/web is read-only; live controlled execution requires explicit platform configuration.",
] as const;

export function evaluateSyriaApprovalBoundary(params: { policy: SyriaPreviewPolicyResult }): SyriaApprovalBoundaryResult {
  try {
    const reasons: SyriaApprovalBoundaryReason[] = ["live_execution_region_block"];
    let requiresHumanApprovalHint = false;

    if (params.policy.decision === "blocked_for_region") {
      requiresHumanApprovalHint = true;
      reasons.push("policy_blocked_for_region");
    } else if (params.policy.decision === "requires_local_approval") {
      requiresHumanApprovalHint = true;
      reasons.push("policy_requires_local_approval");
    } else if (params.policy.decision === "caution_preview") {
      requiresHumanApprovalHint = true;
      reasons.push("policy_caution_preview");
    } else {
      reasons.push("policy_allow_preview");
    }

    return {
      requiresHumanApprovalHint,
      liveExecutionBlocked: true,
      reasons,
      notes: BASE_NOTES,
    };
  } catch {
    return {
      requiresHumanApprovalHint: true,
      liveExecutionBlocked: true,
      reasons: ["live_execution_region_block", "policy_requires_local_approval"],
      notes: ["Syria approval boundary defaulted to conservative posture."],
    };
  }
}
