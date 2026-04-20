/**
 * Syria-specific preview explanation lines — merges signal policy + approval boundary with explainability tags.
 */
import type { SyriaApprovalBoundaryResult } from "@/modules/integrations/regions/syria/syria-approval-boundary.types";
import type { SyriaPreviewPolicyResult } from "@/modules/integrations/regions/syria/syria-policy.types";
import {
  SYRIA_PREVIEW_EXPLAINABILITY_TAGS,
  buildSyriaIdentityScopeLines,
  explainSyriaApprovalBoundaryUserSafe,
  explainSyriaPolicyDecisionUserSafe,
  syriaPolicyDecisionToSummaryTag,
} from "./syria-preview-explainability-rules";

export type SyriaPreviewStructuredExplainability = {
  /** Short lines for graphs / API surfaces. */
  structuredLines: readonly string[];
  /** Human-readable bullets for admin UI. */
  bullets: readonly string[];
};

export function buildSyriaPreviewStructuredExplainability(params: {
  policy: SyriaPreviewPolicyResult;
  boundary: SyriaApprovalBoundaryResult;
  signalCounts?: { critical: number; warning: number; info: number };
  /** When set, adds identity-scope tags for stable listing keys (truncated in tag). */
  regionListingRefDisplayId?: string | null;
}): SyriaPreviewStructuredExplainability {
  const structuredLines: string[] = [
    `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.policyGate}:${syriaPolicyDecisionToSummaryTag(params.policy.decision)}`,
    `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.approvalBoundary}:requires_human_hint=${params.boundary.requiresHumanApprovalHint};live_blocked=${params.boundary.liveExecutionBlocked}`,
    `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.liveExecutionPosture}:true`,
    ...buildSyriaIdentityScopeLines(params.regionListingRefDisplayId),
  ];

  if (params.signalCounts) {
    structuredLines.push(
      `${SYRIA_PREVIEW_EXPLAINABILITY_TAGS.signalSeverityRollup}:critical=${params.signalCounts.critical};warning=${params.signalCounts.warning};info=${params.signalCounts.info}`,
    );
  }

  const bullets: string[] = [
    `Syria preview policy: ${params.policy.decision} — ${params.policy.rationale}`,
    params.boundary.liveExecutionBlocked
      ? "Live autonomous execution is blocked for Syria listings in apps/web (read-only adapter posture)."
      : "Execution posture note — verify platform flags.",
    ...params.boundary.notes,
  ];

  return {
    structuredLines,
    bullets,
  };
}
