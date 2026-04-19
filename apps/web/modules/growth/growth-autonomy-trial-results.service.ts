/**
 * Aggregates audit, monitoring, and operator feedback into one conservative outcome summary.
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import { appendGrowthAutonomyTrialAudit, listGrowthAutonomyTrialAuditTrail } from "./growth-autonomy-trial-audit.service";
import {
  ADJACENT_INTERNAL_TRIAL_ACTION_ID,
  ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
} from "./growth-autonomy-trial-boundaries";
import { resolveGrowthAutonomyTrialDecision } from "./growth-autonomy-trial-decision.service";
import {
  listGrowthAutonomyTrialFeedbackForTrial,
  type GrowthAutonomyTrialFeedbackRow,
} from "./growth-autonomy-trial-feedback.service";
import { getGrowthAutonomyMonitoringSnapshot } from "./growth-autonomy-monitoring.service";
import { evaluateGrowthAutonomyTrialSafety } from "./growth-autonomy-trial-safety-evaluation.service";
import { scoreGrowthAutonomyTrialUsefulness } from "./growth-autonomy-trial-usefulness.service";
import {
  getGrowthAutonomyTrialOutcomeSummary,
  setGrowthAutonomyTrialOutcomeSummary,
} from "./growth-autonomy-trial-results-state.repository";
import type {
  GrowthAutonomyTrialOperatorFeedbackSummary,
  GrowthAutonomyTrialOutcomeSummary,
} from "./growth-autonomy-trial-results.types";
import { recordGrowthAutonomyTrialResultsComputed } from "./growth-autonomy-trial-results-monitoring.service";

const OBSERVATION_DAYS = 30;

function aggregateFeedback(rows: GrowthAutonomyTrialFeedbackRow[]): GrowthAutonomyTrialOperatorFeedbackSummary {
  let helpful = 0;
  let notHelpful = 0;
  let confusing = 0;
  let undoneUnnecessary = 0;
  let rolledBackProblematic = 0;
  for (const r of rows) {
    switch (r.kind) {
      case "helpful":
        helpful += 1;
        break;
      case "not_helpful":
        notHelpful += 1;
        break;
      case "confusing":
        confusing += 1;
        break;
      case "undone_unnecessary":
        undoneUnnecessary += 1;
        break;
      case "rolled_back_problematic":
        rolledBackProblematic += 1;
        break;
      default:
        break;
    }
  }
  const total = rows.length;
  const denom = total > 0 ? total : 0;
  return {
    helpful,
    notHelpful,
    confusing,
    undoneUnnecessary,
    rolledBackProblematic,
    total,
    positiveRate: denom ? helpful / denom : null,
    confusionRate: denom ? confusing / denom : null,
    undoIntentRate: denom ? (undoneUnnecessary + rolledBackProblematic) / denom : null,
  };
}

export function hasAdjacentTrialExecutionInAudit(): boolean {
  return listGrowthAutonomyTrialAuditTrail().some(
    (e) => e.trialActionId === ADJACENT_INTERNAL_TRIAL_ACTION_ID && e.kind === "execution_completed",
  );
}

export function computeGrowthAutonomyTrialOutcomeSummary(): GrowthAutonomyTrialOutcomeSummary | null {
  if (!growthAutonomyFlags.growthAutonomyTrialV1) return null;

  const trialActionId = ADJACENT_INTERNAL_TRIAL_ACTION_ID;
  const auditEntries = listGrowthAutonomyTrialAuditTrail().filter((e) => e.trialActionId === trialActionId);
  const executed = auditEntries.some((e) => e.kind === "execution_completed");
  if (!executed) return null;

  const monitoring = getGrowthAutonomyMonitoringSnapshot();
  const fbRows = listGrowthAutonomyTrialFeedbackForTrial(trialActionId);
  const operatorFeedback = aggregateFeedback(fbRows);

  const approvalsRecorded = auditEntries.filter((e) => e.kind === "approved").length;
  const executionsCompleted = auditEntries.filter((e) => e.kind === "execution_completed").length;
  const rollbacksCompleted = auditEntries.filter((e) => e.kind === "rollback_completed").length;
  const deniesRecorded = auditEntries.filter((e) => e.kind === "denied").length;

  const timesSurfacedInSnapshots = Math.max(1, monitoring.trialSnapshotsEvaluated || 1);

  const sampleSize = operatorFeedback.total + executionsCompleted + approvalsRecorded;

  const usageNumerator = operatorFeedback.total + approvalsRecorded;
  const usageProxyRate = Math.min(1, usageNumerator / Math.max(timesSurfacedInSnapshots, 1));

  const completionFollowThroughRate =
    approvalsRecorded > 0 ? Math.min(1, executionsCompleted / approvalsRecorded) : null;

  const undoNumerator = rollbacksCompleted + operatorFeedback.undoneUnnecessary + operatorFeedback.rolledBackProblematic;
  const undoRollbackRate = sampleSize > 0 ? Math.min(1, undoNumerator / sampleSize) : null;

  const sparseData =
    sampleSize < 4 || (executionsCompleted <= 1 && operatorFeedback.total === 0 && approvalsRecorded <= 1);

  const safety = evaluateGrowthAutonomyTrialSafety({
    auditEntries,
    monitoring,
    feedback: operatorFeedback,
  });

  const usefulnessBand = scoreGrowthAutonomyTrialUsefulness({
    feedback: operatorFeedback,
    undoRollbackRate,
    sparseData,
  });

  const resolved = resolveGrowthAutonomyTrialDecision({
    safety,
    usefulness: usefulnessBand,
    sparseData,
    sampleSize,
  });

  const starts = auditEntries.map((e) => Date.parse(e.at)).filter((n) => !Number.isNaN(n));
  const startedAt = starts.length ? new Date(Math.min(...starts)).toISOString() : null;
  const endedAt = new Date().toISOString();

  const summary: GrowthAutonomyTrialOutcomeSummary = {
    trialActionId,
    actionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    activationWindow: {
      startedAt,
      endedAt,
      observationDays: OBSERVATION_DAYS,
    },
    sampleSize,
    timesSurfacedInSnapshots,
    operatorFeedback,
    completionSignals: {
      approvalsRecorded,
      executionsCompleted,
      rollbacksCompleted,
      deniesRecorded,
    },
    metrics: {
      usageProxyRate,
      completionFollowThroughRate,
      undoRollbackRate,
      sparseData,
    },
    safety,
    usefulnessBand,
    finalDecision: resolved.decision,
    explanation: resolved.explanation,
    operatorLines: resolved.operatorLines,
    computedAt: endedAt,
  };

  const prev = getGrowthAutonomyTrialOutcomeSummary();
  setGrowthAutonomyTrialOutcomeSummary(summary);

  if (!prev || prev.finalDecision !== summary.finalDecision || prev.sampleSize !== summary.sampleSize) {
    try {
      appendGrowthAutonomyTrialAudit({
        kind: "trial_results_computed",
        trialActionId,
        candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
        payload: {
          decision: summary.finalDecision,
          sampleSize: summary.sampleSize,
          safety: summary.safety.level,
          usefulness: summary.usefulnessBand,
        },
      });
    } catch {
      /* noop */
    }
  }

  try {
    recordGrowthAutonomyTrialResultsComputed({
      safetyLevel: summary.safety.level,
      usefulness: summary.usefulnessBand,
      decision: summary.finalDecision,
      insufficientData: summary.finalDecision === "insufficient_data" || usefulnessBand === "insufficient_data",
    });
  } catch {
    /* noop */
  }

  try {
    console.info(
      `[growth:autonomy:trial-results] outcome=${summary.finalDecision} safety=${summary.safety.level} usefulness=${summary.usefulnessBand} sample=${summary.sampleSize}`,
    );
  } catch {
    /* noop */
  }

  return summary;
}
