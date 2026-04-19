/**
 * Append-only audit trail for internal trial lifecycle — never throws.
 */

import type { GrowthAutonomyAdjacentTrialActionType } from "./growth-autonomy-trial.types";

export type GrowthAutonomyTrialAuditEntry = {
  id: string;
  at: string;
  kind:
    | "candidate_evaluated"
    | "approval_requested"
    | "approved"
    | "denied"
    | "activated"
    | "execution_completed"
    | "rollback_started"
    | "rollback_completed"
    | "operator_feedback"
    | "trial_results_computed";
  trialActionId: string;
  candidateActionType: GrowthAutonomyAdjacentTrialActionType;
  actorUserId?: string;
  evidenceSummary?: string;
  explanation?: string;
  notes?: string;
  payload?: Record<string, unknown>;
};

const entries: GrowthAutonomyTrialAuditEntry[] = [];
const MAX = 500;

function ts(): string {
  return new Date().toISOString();
}

export function appendGrowthAutonomyTrialAudit(entry: Omit<GrowthAutonomyTrialAuditEntry, "id" | "at"> & { id?: string }): void {
  try {
    const id = entry.id ?? `trial-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    entries.push({ ...entry, id, at: ts() });
    if (entries.length > MAX) entries.splice(0, entries.length - MAX);
  } catch {
    /* noop */
  }
}

export function listGrowthAutonomyTrialAuditTrail(): GrowthAutonomyTrialAuditEntry[] {
  return [...entries];
}

export function resetGrowthAutonomyTrialAuditForTests(): void {
  entries.length = 0;
}
