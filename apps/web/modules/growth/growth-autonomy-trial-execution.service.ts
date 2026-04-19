/**
 * Single-shot execution for the approved adjacent trial — internal audit artifact only.
 */

import { appendGrowthAutonomyTrialAudit } from "./growth-autonomy-trial-audit.service";
import { recordGrowthAutonomyTrialActivationCompleted } from "./growth-autonomy-monitoring.service";
import {
  getGrowthAutonomyTrialApprovalRecord,
  setGrowthAutonomyTrialApprovalRecord,
} from "./growth-autonomy-trial-state.repository";

export async function executeAdjacentInternalTrialIfReady(args: { gatesAllowExecution: boolean }): Promise<void> {
  try {
    const rec = getGrowthAutonomyTrialApprovalRecord();
    if (!rec || rec.activationStatus !== "approved_internal_trial") return;
    if (!args.gatesAllowExecution) return;
    if (rec.executionArtifactId) return;

    const artifactId = `trial-internal-note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    const updated = {
      ...rec,
      activationStatus: "active" as const,
      executionArtifactId: artifactId,
    };
    setGrowthAutonomyTrialApprovalRecord(updated);
    try {
      recordGrowthAutonomyTrialActivationCompleted();
    } catch {
      /* noop */
    }

    appendGrowthAutonomyTrialAudit({
      kind: "execution_completed",
      trialActionId: rec.trialActionId,
      candidateActionType: rec.candidateActionType,
      explanation:
        "Recorded draft marker only — stored in autonomy trial audit trail; does not mutate CRM, messaging, ads, bookings, or billing.",
      notes: artifactId,
      payload: { artifactId, reversible: true },
    });
  } catch {
    /* noop */
  }
}
