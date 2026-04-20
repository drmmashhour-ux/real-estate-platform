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
  identityScope: "syria_explainability_identity_scope",
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

/** Admin-safe one-liner per decision (deterministic; no PII). */
export function explainSyriaPolicyDecisionUserSafe(decision: SyriaPreviewPolicyDecision): string {
  switch (decision) {
    case "blocked_for_region":
      return "Preview is blocked for this regional scope or adapter configuration — do not rely on outputs.";
    case "requires_local_approval":
      return "Operational review is required before treating this preview as guidance.";
    case "caution_preview":
      return "Preview may be shown but should be read as cautious guidance only.";
    case "allow_preview":
    default:
      return "Preview cleared basic gates — still read-only intelligence; not a substitute for Syria-lane operational checks in the regional app.";
  }
}

/** Plain-language boundary hint for panels and APIs. */
export function explainSyriaApprovalBoundaryUserSafe(params: {
  requiresHumanApprovalHint: boolean;
  liveExecutionBlocked: boolean;
}): string {
  const human = params.requiresHumanApprovalHint
    ? "Human review is suggested for downstream use of this snapshot."
    : "No elevated human-review hint from policy — still verify in the Syria regional app when acting.";
  const exec = params.liveExecutionBlocked
    ? "apps/web cannot execute autonomous actions against Syria listings (read-only posture)."
    : "Verify execution posture with platform flags — default remains conservative.";
  return `${human} ${exec}`;
}

/** Maps stable reason codes to short admin-facing glosses (codes stay in payloads). */
export function syriaApprovalReasonDisplay(reason: string): string {
  switch (reason) {
    case "live_execution_region_block":
      return "Live automation is off for Syria in web (by design).";
    case "policy_blocked_for_region":
      return "Policy treats this preview as blocked for the region.";
    case "policy_requires_local_approval":
      return "Policy expects local / operator approval.";
    case "policy_caution_preview":
      return "Policy marks this preview as caution-only.";
    case "policy_allow_preview":
      return "Policy allows read-only preview under normal constraints.";
    default:
      return reason;
  }
}

export function buildSyriaIdentityScopeLines(regionListingRefDisplayId?: string | null): readonly string[] {
  const lines: string[] = [
    `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.identityScope}:source=syria;web_scope=read_only_adapter`,
  ];
  if (regionListingRefDisplayId && String(regionListingRefDisplayId).trim()) {
    lines.push(
      `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.identityScope}:stable_key_present=true;ref=${String(regionListingRefDisplayId).slice(0, 64)}`,
    );
  }
  return lines;
}
