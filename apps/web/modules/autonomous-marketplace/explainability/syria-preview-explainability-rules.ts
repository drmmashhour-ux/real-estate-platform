/**
 * Deterministic Syria preview explainability rule tags — no ML; pairs with signal policy + approval boundary.
 */
import type { SyriaPreviewPolicyDecision } from "@/modules/integrations/regions/syria/syria-policy.types";

/** Stable codes for dashboards / logs (not user-facing prose). */
export const SYRIA_PREVIEW_EXPLAINABILITY_TAGS = {
  policyGate: "syria_explainability_policy_gate",
  approvalBoundary: "syria_explainability_approval_boundary",
  liveExecutionPosture: "syria_explainability_live_execution_blocked",
  signalSeverityRollup: "syria_explainability_signal_severity_rollup",
} as const;

export function syriaPolicyDecisionToSummaryTag(decision: SyriaPreviewPolicyDecision): string {
  switch (decision) {
    case "blocked_for_region":
      return "syria_policy_blocked_for_region";
    case "requires_local_approval":
      return "syria_policy_requires_local_approval";
    case "caution_preview":
      return "syria_policy_caution_preview";
    case "allow_preview":
    default:
      return "syria_policy_allow_preview";
  }
}
