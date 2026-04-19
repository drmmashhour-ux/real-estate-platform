/**
 * Strict, explainable safety posture for the adjacent internal trial measurement window.
 */

import type { GrowthAutonomyTrialAuditEntry } from "./growth-autonomy-trial-audit.service";
import type { GrowthAutonomyMonitoringState } from "./growth-autonomy-monitoring.service";
import type { GrowthAutonomyTrialOperatorFeedbackSummary } from "./growth-autonomy-trial-results.types";
import type { GrowthAutonomyTrialSafetySignal } from "./growth-autonomy-trial-results.types";

export function evaluateGrowthAutonomyTrialSafety(args: {
  auditEntries: GrowthAutonomyTrialAuditEntry[];
  monitoring: GrowthAutonomyMonitoringState;
  feedback: GrowthAutonomyTrialOperatorFeedbackSummary;
}): GrowthAutonomyTrialSafetySignal {
  const reasons: string[] = [];
  let auditGapSuspected = false;

  const executions = args.auditEntries.filter((e) => e.kind === "execution_completed").length;
  const approvals = args.auditEntries.filter((e) => e.kind === "approved").length;
  if (executions > approvals + 1) {
    auditGapSuspected = true;
    reasons.push("Execution events exceed approvals + 1 — audit ordering should be reviewed.");
  }

  const rollbacks = args.auditEntries.filter((e) => e.kind === "rollback_completed").length;
  if (rollbacks >= 2) {
    reasons.push("Multiple rollback completions recorded — operator churn risk.");
  }

  if (args.feedback.rolledBackProblematic >= 2) {
    reasons.push("Operators flagged repeated problematic rollback outcomes.");
  }

  const killOrFreezeDuringWindow = args.monitoring.trialKillFreezeBlocks > 0;
  if (killOrFreezeDuringWindow) {
    reasons.push("Trial freeze or kill-switch blocks fired during the window (monitoring counter).");
  }

  const confusionSpike =
    args.feedback.total >= 4 &&
    (args.feedback.confusionRate ?? 0) >= 0.5;
  if (confusionSpike) {
    reasons.push("Confusion feedback ratio is high relative to volume.");
  }

  let level: GrowthAutonomyTrialSafetySignal["level"] = "safe";
  if (reasons.length >= 2 || args.feedback.rolledBackProblematic >= 3 || auditGapSuspected) {
    level = "unsafe";
  } else if (reasons.length === 1 || rollbacks === 1 || killOrFreezeDuringWindow) {
    level = "caution";
  }

  return {
    level,
    reasons,
    auditGapSuspected,
    killOrFreezeDuringWindow,
  };
}
