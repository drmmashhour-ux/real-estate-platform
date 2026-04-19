/**
 * Evidence-based expansion decisions — conservative; never activates without stored approval + flags.
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import { GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST } from "./growth-autonomy-auto-allowlist";
import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";
import { expansionAdjacencyIsAllowed } from "./growth-autonomy-expansion-boundaries";
import {
  expansionMaxUndoRate,
  expansionMinPositiveFeedbackRatio,
  expansionMinSampleSize,
} from "./growth-autonomy-expansion-config";
import {
  GROWTH_AUTONOMY_EXPANSION_CANDIDATES,
} from "./growth-autonomy-expansion-candidates";
import {
  buildEvidenceForLowRiskActionKey,
  expansionObservationSince,
  loadExecutionStatsMap,
  loadLearningAggregatesForExpansion,
} from "./growth-autonomy-expansion-evidence.service";
import { getGrowthAutonomyExpansionState } from "./growth-autonomy-expansion.repository";
import type {
  GrowthAutonomyExpansionDecision,
  GrowthAutonomyExpansionEvidence,
  GrowthAutonomyExpansionReport,
  GrowthAutonomyExpansionStatus,
} from "./growth-autonomy-expansion.types";
import type { GrowthAutonomyExpansionCandidate } from "./growth-autonomy-expansion.types";
import { evaluateGrowthAutonomyAuditHealth } from "./growth-autonomy-audit-health.service";
import { evaluateAdjacentTrialExpansionGovernanceLock } from "./growth-autonomy-trial-expansion-lock.service";
import {
  computeGrowthAutonomyTrialOutcomeSummary,
  hasAdjacentTrialExecutionInAudit,
} from "./growth-autonomy-trial-results.service";
import { getGrowthAutonomyTrialOutcomeSummary } from "./growth-autonomy-trial-results-state.repository";
import {
  recordExpansionCandidateEvaluated,
  recordExpansionInsufficientData,
  recordExpansionEligibleTrial,
  recordExpansionHold,
  recordExpansionRollbackFlag,
  recordExpansionAuditBlocked,
  recordExpansionFreezeBlocked,
} from "./growth-autonomy-expansion-monitoring.service";

function explainParentPattern(args: {
  ev: GrowthAutonomyExpansionEvidence;
  minSample: number;
  maxUndo: number;
  badFeedback: boolean;
}): { status: GrowthAutonomyExpansionStatus; decision: GrowthAutonomyExpansionDecision; explanation: string } {
  const { ev } = args;
  if (ev.sampleSizeExecuted < args.minSample) {
    return {
      status: "insufficient_data",
      decision: "hold_scope",
      explanation: `${ev.lowRiskActionKey}: insufficient execution samples (${ev.sampleSizeExecuted}) in the observation window.`,
    };
  }
  if (ev.undoRate > args.maxUndo) {
    return {
      status: "rollback_candidate",
      decision: "flag_rollback",
      explanation: `${ev.lowRiskActionKey}: undo rate ${(ev.undoRate * 100).toFixed(1)}% exceeds the conservative threshold (${(args.maxUndo * 100).toFixed(0)}%).`,
    };
  }
  if (args.badFeedback) {
    return {
      status: "hold",
      decision: "hold_scope",
      explanation: `${ev.lowRiskActionKey}: operator feedback skews negative or mixed for this pattern — holding scope.`,
    };
  }
  return {
    status: "eligible_for_trial",
    decision: "hold_scope",
    explanation: `${ev.lowRiskActionKey}: audit and feedback signals are stable — parent pattern remains eligible for governed expansion review only.`,
  };
}

function explainCandidate(args: {
  candidate: GrowthAutonomyExpansionCandidate;
  parentEv: GrowthAutonomyExpansionEvidence;
  minSample: number;
  maxUndo: number;
  minPos: number;
  auditHealthy: boolean;
  freeze: boolean;
  expansionOn: boolean;
  alreadyApproved: boolean;
  boundaryOk: boolean;
}): { status: GrowthAutonomyExpansionStatus; decision: GrowthAutonomyExpansionDecision; explanation: string } {
  const { candidate, parentEv } = args;
  if (!args.expansionOn) {
    return {
      status: "not_eligible",
      decision: "hold_scope",
      explanation: `${candidate.id}: expansion framework flag is off — no trials proposed.`,
    };
  }
  if (!args.boundaryOk) {
    return {
      status: "not_eligible",
      decision: "requires_manual_review",
      explanation: `${candidate.id}: proposed expansion fails safe-class adjacency checks.`,
    };
  }
  if (args.freeze) {
    try {
      recordExpansionFreezeBlocked();
    } catch {
      /* noop */
    }
    return {
      status: "hold",
      decision: "hold_scope",
      explanation: `${candidate.id}: expansion freeze is active — no new trial activations.`,
    };
  }
  if (!args.auditHealthy) {
    try {
      recordExpansionAuditBlocked();
    } catch {
      /* noop */
    }
    return {
      status: "hold",
      decision: "requires_manual_review",
      explanation: `${candidate.id}: audit health gate failed — expansion proposals are paused until audit quality recovers.`,
    };
  }
  if (args.alreadyApproved) {
    return {
      status: "approved_for_internal_expansion",
      decision: "approve_internal_expansion",
      explanation: `${candidate.id}: previously approved for internal trial — monitor outcomes; rollback if undo or complaints rise.`,
    };
  }

  if (parentEv.sampleSizeExecuted < args.minSample || parentEv.learningSparse) {
    try {
      recordExpansionInsufficientData();
    } catch {
      /* noop */
    }
    return {
      status: "insufficient_data",
      decision: "hold_scope",
      explanation: `${candidate.id}: parent pattern has sparse evidence or insufficient executions — no adjacent trial.`,
    };
  }

  const fbDenom = parentEv.learningHelpfulYes + parentEv.learningHelpfulNo;
  const badFeedback =
    fbDenom >= 6 &&
    parentEv.positiveFeedbackRate !== undefined &&
    parentEv.positiveFeedbackRate < args.minPos;

  if (parentEv.undoRate > args.maxUndo || badFeedback) {
    try {
      recordExpansionRollbackFlag();
    } catch {
      /* noop */
    }
    return {
      status: "rollback_candidate",
      decision: "flag_rollback",
      explanation: `${candidate.id}: parent signals are weak (undo ${(parentEv.undoRate * 100).toFixed(1)}% or mixed feedback) — do not expand; consider reducing scope.`,
    };
  }

  try {
    recordExpansionEligibleTrial();
  } catch {
    /* noop */
  }
  return {
    status: "eligible_for_trial",
    decision: "propose_internal_trial",
    explanation: `${candidate.id}: conservative evidence supports proposing an adjacent internal-only trial (${candidate.proposedActionKey}) — requires explicit admin approval before activation.`,
  };
}

export async function evaluateGrowthAutonomyExpansionLandscape(): Promise<GrowthAutonomyExpansionReport> {
  const generatedAt = new Date().toISOString();
  const expansionOn = growthAutonomyFlags.growthAutonomyExpansionV1;
  const panelOn = growthAutonomyFlags.growthAutonomyExpansionPanelV1;

  const since = expansionObservationSince();
  const windowDays = Math.round((Date.now() - since.getTime()) / 86_400_000);

  const auditRaw = await evaluateGrowthAutonomyAuditHealth({ since });
  const auditHealth = {
    healthy: auditRaw.healthy,
    reasons: auditRaw.reasons,
    rowCountWindow: auditRaw.rowCountWindow,
    distinctActionKeys: auditRaw.distinctActionKeys,
    explanationIntegritySample: {
      sampled: auditRaw.explanationIntegritySample.sampled,
      withSubstantiveExplanation: auditRaw.explanationIntegritySample.withSubstantiveExplanation,
    },
  };

  const statsByKey = await loadExecutionStatsMap({ since });
  const learningAgg = await loadLearningAggregatesForExpansion();
  const state = await getGrowthAutonomyExpansionState();

  const minSample = expansionMinSampleSize();
  const maxUndo = expansionMaxUndoRate();
  const minPos = expansionMinPositiveFeedbackRatio();

  if (growthAutonomyFlags.growthAutonomyTrialV1 && hasAdjacentTrialExecutionInAudit()) {
    try {
      computeGrowthAutonomyTrialOutcomeSummary();
    } catch {
      /* noop */
    }
  }

  const trialOutcome = getGrowthAutonomyTrialOutcomeSummary();
  const trialGovernanceLock = evaluateAdjacentTrialExpansionGovernanceLock({
    trialFeatureOn: growthAutonomyFlags.growthAutonomyTrialV1,
    trialEverExecuted: hasAdjacentTrialExecutionInAudit(),
    trialOutcomeMeasured: trialOutcome !== null,
  });

  const parentKeys = new Set<GrowthAutonomyLowRiskActionKey>();
  for (const v of Object.values(GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST)) {
    parentKeys.add(v.lowRiskActionKey);
  }

  const parentOutcomes: GrowthAutonomyExpansionReport["parentOutcomes"] = [];

  for (const pk of parentKeys) {
    try {
      recordExpansionCandidateEvaluated();
    } catch {
      /* noop */
    }

    const ev = await buildEvidenceForLowRiskActionKey({
      lowRiskActionKey: pk,
      statsByKey,
      learningAggregates: learningAgg,
      observationWindowDays: windowDays,
    });

    const fbDenom = ev.learningHelpfulYes + ev.learningHelpfulNo;
    const badFeedback =
      fbDenom >= 6 && ev.positiveFeedbackRate !== undefined && ev.positiveFeedbackRate < minPos;

    const po = explainParentPattern({ ev, minSample, maxUndo, badFeedback });
    parentOutcomes.push({
      evidence: ev,
      status: po.status,
      decision: po.decision,
      explanation: po.explanation,
    });
  }

  const activatedIds = new Set(state.activatedTrials.map((t) => t.candidateId));

  const candidateOutcomes: GrowthAutonomyExpansionReport["candidateOutcomes"] = [];

  for (const candidate of GROWTH_AUTONOMY_EXPANSION_CANDIDATES) {
    const boundaryOk = expansionAdjacencyIsAllowed(candidate.parentActionKey, candidate.proposedActionKey as string);

    const parentEv = await buildEvidenceForLowRiskActionKey({
      lowRiskActionKey: candidate.parentActionKey,
      statsByKey,
      learningAggregates: learningAgg,
      observationWindowDays: windowDays,
    });

    const co = explainCandidate({
      candidate,
      parentEv,
      minSample,
      maxUndo,
      minPos,
      auditHealthy: auditHealth.healthy,
      freeze: growthAutonomyFlags.growthAutonomyExpansionFreeze || state.freeze,
      expansionOn: expansionOn,
      alreadyApproved: activatedIds.has(candidate.id),
      boundaryOk,
    });

    try {
      recordExpansionCandidateEvaluated();
    } catch {
      /* noop */
    }
    if (co.status === "hold" && co.decision === "hold_scope" && parentEv.sampleSizeExecuted >= minSample) {
      try {
        recordExpansionHold();
      } catch {
        /* noop */
      }
    }

    candidateOutcomes.push({
      candidate,
      parentEvidence: parentEv,
      status: co.status,
      decision: co.decision,
      explanation: co.explanation,
    });
  }

  return {
    generatedAt,
    expansionFeatureOn: expansionOn,
    expansionPanelOn: panelOn,
    expansionFreezeFlag: growthAutonomyFlags.growthAutonomyExpansionFreeze || state.freeze,
    auditHealth,
    parentOutcomes,
    candidateOutcomes,
    pending: state.pending,
    activatedTrials: state.activatedTrials,
    adjacentTrialGovernanceLock: growthAutonomyFlags.growthAutonomyTrialV1 ?
      {
        blocksExpansionApprovals: trialGovernanceLock.blocksExpansionApprovals,
        reason: trialGovernanceLock.reason,
        trialMeasurementReady: trialGovernanceLock.trialMeasurementReady,
        trialOutcomeDecision: trialOutcome?.finalDecision ?? null,
      }
    : undefined,
  };
}
