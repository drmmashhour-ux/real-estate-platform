/**
 * Rollback clears trial slot — operators can restart eligibility after undo.
 */

import { appendGrowthAutonomyTrialAudit } from "./growth-autonomy-trial-audit.service";
import {
  getGrowthAutonomyTrialApprovalRecord,
  setGrowthAutonomyTrialApprovalRecord,
} from "./growth-autonomy-trial-state.repository";
import {
  recordGrowthAutonomyTrialRollbackCompleted,
  recordGrowthAutonomyTrialRollbackStarted,
} from "./growth-autonomy-monitoring.service";

export function rollbackGrowthAutonomyTrial(args: {
  actorUserId: string;
  notes?: string;
}): { ok: boolean; reason?: string } {
  try {
    const rec = getGrowthAutonomyTrialApprovalRecord();
    if (!rec) {
      return { ok: false, reason: "No trial approval record exists." };
    }
    if (rec.activationStatus !== "active" && rec.activationStatus !== "approved_internal_trial") {
      return { ok: false, reason: "Only approved or active trials can be rolled back." };
    }

    recordGrowthAutonomyTrialRollbackStarted();

    appendGrowthAutonomyTrialAudit({
      kind: "rollback_started",
      trialActionId: rec.trialActionId,
      candidateActionType: rec.candidateActionType,
      actorUserId: args.actorUserId,
      notes: args.notes ?? null,
    });

    appendGrowthAutonomyTrialAudit({
      kind: "rollback_completed",
      trialActionId: rec.trialActionId,
      candidateActionType: rec.candidateActionType,
      actorUserId: args.actorUserId,
      explanation: "Trial slot cleared — draft marker discarded from active state.",
      notes: args.notes ?? null,
      payload: { priorArtifactId: rec.executionArtifactId },
    });

    setGrowthAutonomyTrialApprovalRecord(null);
    recordGrowthAutonomyTrialRollbackCompleted();
    return { ok: true };
  } catch {
    return { ok: false, reason: "Rollback failed." };
  }
}
