/**
 * Deterministic operator-facing copy for low-risk execution — no vague “AI handled it” wording.
 */

import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";

export function explainSafeAutoExecutionAllowed(args: {
  catalogLabel: string;
  lowRiskActionKey: GrowthAutonomyLowRiskActionKey;
  rolloutStageLabel: string;
}): string {
  return `${args.catalogLabel}: auto-ran because this action is allowlisted as low-risk internal work only, policy allows it, kill switch is off, and rollout is ${args.rolloutStageLabel}. No payments, bookings, ads, CRO, external sends, or listing state were changed.`;
}

export function explainAutoDowngrade(args: { reasons: string[] }): string {
  if (args.reasons.length === 0) return "Showing advisory / prefilled assistance only — no automatic internal write.";
  return `Automatic internal execution was not applied: ${args.reasons.join(" ")}`;
}

export function explainUndoForAction(key: GrowthAutonomyLowRiskActionKey): string {
  switch (key) {
    case "create_internal_review_task":
    case "create_internal_followup_task":
      return "You can archive or dismiss the internal task record created for this suggestion.";
    case "create_internal_content_draft":
      return "Discard the draft artifact from your growth drafts list if you do not need it.";
    case "queue_internal_followup_reminder":
      return "Clear or archive the queued reminder from your operator task list.";
    case "add_internal_priority_tag":
      return "Remove the internal priority tag from the operator queue when no longer needed.";
    case "prefill_simulation_context":
      return "Clear the saved simulation context prefill if you want a clean slate.";
    default:
      return "Use undo below to reverse this internal-only record when supported.";
  }
}
