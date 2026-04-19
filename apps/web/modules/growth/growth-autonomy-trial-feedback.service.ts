/**
 * Normalized operator feedback for the adjacent internal trial — in-process only.
 */

import { appendGrowthAutonomyTrialAudit } from "./growth-autonomy-trial-audit.service";
import { ADJACENT_INTERNAL_TRIAL_ACTION_ID } from "./growth-autonomy-trial-boundaries";
import type { GrowthAutonomyAdjacentTrialActionType } from "./growth-autonomy-trial.types";

export type GrowthAutonomyTrialOperatorFeedbackKind =
  | "helpful"
  | "not_helpful"
  | "confusing"
  | "undone_unnecessary"
  | "rolled_back_problematic";

export type GrowthAutonomyTrialFeedbackRow = {
  at: string;
  trialActionId: string;
  candidateActionType: GrowthAutonomyAdjacentTrialActionType;
  kind: GrowthAutonomyTrialOperatorFeedbackKind;
  actorUserId?: string;
  notes?: string | null;
};

const rows: GrowthAutonomyTrialFeedbackRow[] = [];
const MAX = 200;

/** Accept API/raw strings and normalize to canonical kinds. */
export function normalizeGrowthAutonomyTrialFeedbackKind(raw: string): GrowthAutonomyTrialFeedbackKind | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const map: Record<string, GrowthAutonomyTrialFeedbackKind> = {
    helpful: "helpful",
    not_helpful: "not_helpful",
    nothelpful: "not_helpful",
    confusing: "confusing",
    undone_unnecessary: "undone_unnecessary",
    undonebecauseunnecessary: "undone_unnecessary",
    rolled_back_problematic: "rolled_back_problematic",
    rollback_problematic: "rolled_back_problematic",
  };
  return map[s] ?? null;
}

export function recordGrowthAutonomyTrialOperatorFeedback(entry: Omit<GrowthAutonomyTrialFeedbackRow, "at">): void {
  try {
    rows.push({ ...entry, at: new Date().toISOString() });
    if (rows.length > MAX) rows.splice(0, rows.length - MAX);
    appendGrowthAutonomyTrialAudit({
      kind: "operator_feedback",
      trialActionId: entry.trialActionId,
      candidateActionType: entry.candidateActionType,
      actorUserId: entry.actorUserId,
      notes: entry.notes ?? undefined,
      payload: { feedbackKind: entry.kind },
    });
  } catch {
    /* noop */
  }
}

export function listGrowthAutonomyTrialFeedbackForTrial(trialActionId: string): GrowthAutonomyTrialFeedbackRow[] {
  return rows.filter((r) => r.trialActionId === trialActionId);
}

export function resetGrowthAutonomyTrialFeedbackForTests(): void {
  rows.length = 0;
}

export const TRIAL_FEEDBACK_LABELS: Record<GrowthAutonomyTrialOperatorFeedbackKind, string> = {
  helpful: "Helpful",
  not_helpful: "Not helpful",
  confusing: "Confusing",
  undone_unnecessary: "Undone — unnecessary",
  rolled_back_problematic: "Rolled back — problematic",
};

/** Default trial id for the single adjacent trial UX. */
export function defaultAdjacentTrialActionId(): string {
  return ADJACENT_INTERNAL_TRIAL_ACTION_ID;
}
