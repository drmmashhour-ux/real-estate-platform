/**
 * Preview-only proposed actions — DRY_RUN metadata; never invokes executors.
 */

import type { Opportunity, PolicyDecision, ProposedAction } from "../types/domain.types";
import { filterPreviewActionsByPolicy, parsePreviewDisposition } from "./preview-action-filter.service";

export type { PreviewDisposition } from "./preview-action-filter.service";

/**
 * Builds up to five preview-only proposed actions — skips actions blocked in preview policy pass.
 * Delegates filtering to `filterPreviewActionsByPolicy` for a single annotation path.
 */
export function buildPreviewActions(params: {
  opportunities: Opportunity[];
  policyDecisions: PolicyDecision[];
}): ProposedAction[] {
  try {
    const proposedActionsFlat = params.opportunities.flatMap((o) => o.proposedActions);
    const filtered = filterPreviewActionsByPolicy({
      proposedActions: proposedActionsFlat,
      policyDecisions: params.policyDecisions,
    });
    const capped = filtered.slice(0, 5);
    return capped.map((action) => {
      const idx = proposedActionsFlat.findIndex((a) => a.id === action.id);
      const policy = idx >= 0 ? params.policyDecisions[idx] : undefined;
      const disposition = policy ? parsePreviewDisposition(policy) : "allow";
      const legacyReason =
        disposition === "caution"
          ? "Included as a preview-only recommendation — policy flagged caution; execution remains disabled."
          : "Included as a preview-only recommendation — policy allows dry-run posture; execution remains disabled.";
      return {
        ...action,
        metadata: {
          ...action.metadata,
          previewDisposition: disposition,
          previewReason: legacyReason,
        },
      };
    });
  } catch {
    return [];
  }
}
