/**
 * Strict boundary: exactly ONE adjacent low-risk internal trial action type for this phase.
 */

import type { GrowthAutonomyAdjacentTrialActionType } from "./growth-autonomy-trial.types";

export const ADJACENT_INTERNAL_TRIAL_ACTION_ID = "trial-internal-review-note-variant";

/** Human-readable label — operator-visible only; no vague AI wording. */
export const ADJACENT_INTERNAL_TRIAL_LABEL =
  "Prepare one internal review note variant (audit-only draft text; no external send)";

export const ADJACENT_INTERNAL_TRIAL_ACTION_TYPE: GrowthAutonomyAdjacentTrialActionType =
  "internal_review_note_variant";

/** Must stay internal, reversible, non-monetization, no core product mutation. */
export const ADJACENT_TRIAL_SCOPE_RULES = [
  "Internal-only — visible to operators in Growth autonomy audit only.",
  "Reversible — rollback removes the draft artifact marker and clears operator visibility.",
  "No payments, booking core, ads core, CRO core, pricing, or external messaging.",
  "Single active trial action at a time — no parallel adjacent trials.",
] as const;
