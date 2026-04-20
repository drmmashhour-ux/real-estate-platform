/**
 * Preview-only — removes actions blocked in preview policy pass and annotates survivors (no execution).
 */

import type { PolicyDecision, ProposedAction } from "../types/domain.types";

export type PreviewDisposition = "allow" | "caution" | "blocked_in_preview";

/** Reads `preview_pipeline_disposition` rule emitted by the preview policy engine. */
export function parsePreviewDisposition(policy: PolicyDecision): PreviewDisposition {
  const hint = policy.ruleResults.find((r) => r.ruleCode === "preview_pipeline_disposition");
  const tail = hint?.reason?.replace(/^Preview disposition:\s*/i, "").trim();
  if (tail === "allow" || tail === "caution" || tail === "blocked_in_preview") {
    return tail;
  }
  return "allow";
}

export function filterPreviewActionsByPolicy(params: {
  proposedActions: ProposedAction[];
  policyDecisions: PolicyDecision[];
}): ProposedAction[] {
  try {
    const out: ProposedAction[] = [];
    for (let i = 0; i < params.proposedActions.length; i++) {
      const action = params.proposedActions[i]!;
      const policy = params.policyDecisions[i];
      if (!policy) continue;
      const disposition = parsePreviewDisposition(policy);
      if (disposition === "blocked_in_preview") continue;

      const policyStatus = disposition === "caution" ? "caution" : "allow";
      const reason =
        disposition === "caution"
          ? "Preview policy: caution — retained for planning; execution remains disabled."
          : "Preview policy: allow — dry-run posture; execution remains disabled.";

      out.push({
        ...action,
        metadata: {
          ...action.metadata,
          previewExecution: "DRY_RUN" as const,
          previewPolicyStatus: policyStatus,
          previewPolicyReason: reason,
        },
      });
    }
    return out;
  } catch {
    return [];
  }
}
