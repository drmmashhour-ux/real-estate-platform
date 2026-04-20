/** Syria approval / execution boundary — deterministic hints; apps/web stays read-only for Syria by default. */

export type SyriaApprovalBoundaryReason =
  /** Controlled execution and outbound automation are not enabled for Syria in this phase. */
  | "live_execution_region_block"
  | "policy_blocked_for_region"
  | "policy_requires_local_approval"
  | "policy_caution_preview"
  | "policy_allow_preview";

export type SyriaApprovalBoundaryResult = {
  /** Operator should treat output as needing human review before operational use. */
  requiresHumanApprovalHint: boolean;
  /** Live autonomous execution is never available for Syria listing targets in current web adapter posture. */
  liveExecutionBlocked: boolean;
  reasons: SyriaApprovalBoundaryReason[];
  notes: readonly string[];
};
