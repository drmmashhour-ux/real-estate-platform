/**
 * Fusion-local governance evaluation — advisory; never mutates source systems or external flags.
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { getGlobalFusionMonitoringSnapshot } from "./global-fusion-monitoring.service";
import { getLastLearningSummary } from "./global-fusion-learning-monitoring.service";
import { getWeightDriftFromDefaultL1 } from "./global-fusion-learning-weights.service";
import { applyGlobalFusionFreeze, getGlobalFusionFreezeState } from "./global-fusion-freeze.service";
import * as G from "./global-fusion-governance.constants";
import {
  recordGovernanceEvaluation,
  recordThresholdBreach,
  recordFreezeToggle,
  getConsecutiveCautionOrWorse,
} from "./global-fusion-governance-monitoring.service";
import type {
  GlobalFusionGovernanceDecision,
  GlobalFusionGovernanceMetrics,
  GlobalFusionGovernanceSnapshot,
  GlobalFusionGovernanceStatus,
  GlobalFusionGovernanceThresholdState,
} from "./global-fusion.types";

function buildMetrics(): {
  metrics: GlobalFusionGovernanceMetrics;
  runs: number;
} {
  const mon = getGlobalFusionMonitoringSnapshot();
  const last = getLastLearningSummary();
  const drift = getWeightDriftFromDefaultL1();
  const metrics: GlobalFusionGovernanceMetrics = {
    fallbackRate: mon.fallbackRate,
    missingSourceRate: mon.missingSourceRate,
    conflictRate: mon.conflictRate,
    disagreementRate: mon.disagreementRate,
    lowEvidenceRate: mon.lowEvidenceRate,
    influenceAppliedRate: mon.influenceAppliedRate,
    anomalyRate: mon.anomalyRate,
    learningAccuracy: last?.recommendationHitRate ?? null,
    calibrationQuality:
      last?.falsePositiveRate != null ? Math.max(0, 1 - last.falsePositiveRate) : null,
    weightDrift: drift,
  };
  return { metrics, runs: mon.runsTotal };
}

function buildThresholdState(m: GlobalFusionGovernanceMetrics, runs: number): GlobalFusionGovernanceThresholdState {
  const active = runs >= 2;
  const st: GlobalFusionGovernanceThresholdState = {
    fallbackBreached: active && m.fallbackRate >= G.GF_GOV_FALLBACK_WATCH,
    missingSourceBreached: active && m.missingSourceRate >= G.GF_GOV_MISSING_WATCH,
    conflictBreached: active && m.conflictRate >= G.GF_GOV_CONFLICT_CAUTION,
    disagreementBreached: active && m.disagreementRate >= G.GF_GOV_DISAGREE_CAUTION,
    lowEvidenceBreached: active && m.lowEvidenceRate >= G.GF_GOV_LOW_EVIDENCE_CAUTION,
    anomalyBreached: active && m.anomalyRate >= G.GF_GOV_ANOMALY_CAUTION,
    unstableOrderingBreached: active && monSnapshotUnstable(),
    weightDriftBreached: m.weightDrift >= G.GF_GOV_WEIGHT_DRIFT_WATCH,
    learningQualityBreached:
      m.learningAccuracy != null && m.learningAccuracy < G.GF_GOV_LEARNING_HIT_CAUTION,
    malformedBreached: active && getMalformedRate() > 0.12,
  };
  return st;
}

function monSnapshotUnstable(): boolean {
  const mon = getGlobalFusionMonitoringSnapshot();
  return mon.unstableOrderingRate >= G.GF_GOV_UNSTABLE_ORDER_CAUTION;
}

function getMalformedRate(): number {
  return getGlobalFusionMonitoringSnapshot().malformedInputRate;
}

function decide(
  m: GlobalFusionGovernanceMetrics,
  ts: GlobalFusionGovernanceThresholdState,
  runs: number,
): {
  decision: GlobalFusionGovernanceDecision;
  reasons: string[];
  warnings: GlobalFusionGovernanceWarning[];
  notes: string[];
} {
  const reasons: string[] = [];
  const warnings: GlobalFusionGovernanceWarning[] = [];
  const notes: string[] = [];
  let decision: GlobalFusionGovernanceDecision = "healthy";

  if (runs < 2) {
    notes.push("insufficient_monitoring_runs_for_strong_signals");
    return { decision: "watch", reasons: ["runs_lt_2"], warnings, notes };
  }

  Object.entries(ts).forEach(([k, v]) => {
    if (v) recordThresholdBreach(k);
  });

  if (m.weightDrift >= G.GF_GOV_WEIGHT_DRIFT_FREEZE) {
    reasons.push("weight_drift_above_freeze_threshold");
    decision = "freeze_learning_recommended";
  }

  if (
    m.fallbackRate >= G.GF_GOV_FALLBACK_ROLLBACK &&
    runs >= G.GF_GOV_MIN_RUNS_FOR_ROLLBACK &&
    getConsecutiveCautionOrWorse() >= G.GF_GOV_CONSECUTIVE_CAUTION_FOR_ROLLBACK
  ) {
    reasons.push("sustained_high_fallback_rate");
    decision = "rollback_recommended";
  } else if (m.fallbackRate >= G.GF_GOV_FALLBACK_CAUTION) {
    reasons.push("elevated_fallback_rate");
    decision = decision === "healthy" ? "caution" : decision;
  } else if (m.fallbackRate >= G.GF_GOV_FALLBACK_WATCH) {
    decision = decision === "healthy" ? "watch" : decision;
  }

  if (m.anomalyRate >= G.GF_GOV_ANOMALY_ROLLBACK && runs >= G.GF_GOV_MIN_RUNS_FOR_ROLLBACK) {
    reasons.push("anomaly_rate_severe");
    decision = "require_human_review";
  } else if (m.anomalyRate >= G.GF_GOV_ANOMALY_CAUTION) {
    decision = decision === "healthy" || decision === "watch" ? "caution" : decision;
  }

  if (ts.conflictBreached && ts.disagreementBreached) {
    warnings.push({ code: "conflict_and_disagreement", detail: "both elevated" });
    decision = decision === "healthy" || decision === "watch" ? "caution" : decision;
  }

  if (ts.malformedBreached) {
    warnings.push({ code: "malformed_inputs", detail: "elevated malformed rate" });
    decision = decision === "healthy" ? "watch" : decision;
  }

  if (ts.learningQualityBreached) {
    reasons.push("low_learning_proxy_accuracy");
    if (decision === "healthy" || decision === "watch") decision = "caution";
  }

  if (decision === "rollback_recommended" || decision === "require_human_review") {
    /* keep */
  } else if (decision === "freeze_learning_recommended") {
    /* keep */
  } else if (reasons.length === 0 && decision === "healthy") {
    notes.push("all_metrics_within_baseline");
  }

  return { decision, reasons, warnings, notes };
}

export function buildGlobalFusionRollbackSignal(
  status: GlobalFusionGovernanceStatus,
): GlobalFusionRollbackSignal | null {
  if (!globalFusionFlags.globalFusionAutoRollbackSignalV1) {
    return null;
  }
  let level: GlobalFusionRollbackSignal["level"] = "watch";
  if (status.decision === "rollback_recommended") level = "rollback_recommended";
  else if (status.decision === "require_human_review") level = "require_human_review";
  else if (status.decision === "caution") level = "caution";
  else if (status.decision === "watch") level = "watch";
  else return null;

  return {
    level,
    summary: status.recommendation,
    contributingFactors: status.reasons.slice(0, 8),
    emittedAt: new Date().toISOString(),
    formal: true,
  };
}

export function evaluateGlobalFusionGovernance(): GlobalFusionGovernanceSnapshot {
  const { metrics, runs } = buildMetrics();
  const ts = buildThresholdState(metrics, runs);

  if (!globalFusionFlags.globalFusionGovernanceV1) {
    return {
      evaluatedAt: new Date().toISOString(),
      status: {
        decision: "healthy",
        recommendation: "Global Fusion governance evaluation is disabled (flag off).",
        warnings: [],
        metrics,
        thresholdState: ts,
        reasons: [],
        notes: ["FEATURE_GLOBAL_FUSION_GOVERNANCE_V1_off"],
      },
      governanceEnabled: false,
      autoFreezeEnabled: false,
      autoRollbackSignalEnabled: false,
    };
  }

  const { decision: rawDecision, reasons, warnings, notes } = decide(metrics, ts, runs);

  const freezeBefore = getGlobalFusionFreezeState();
  let decision: GlobalFusionGovernanceDecision = rawDecision;
  let freezeDecision = {
    learningFreezeRecommended:
      rawDecision === "freeze_learning_recommended" || rawDecision === "rollback_recommended",
    influenceFreezeRecommended:
      metrics.anomalyRate >= G.GF_GOV_ANOMALY_CAUTION || monSnapshotUnstable(),
    learningFreezeApplied: freezeBefore.learningFrozen,
    influenceFreezeApplied: freezeBefore.influenceFrozen,
    reason: freezeBefore.reason ?? "",
  };

  if (freezeBefore.learningFrozen && decision === "freeze_learning_recommended") {
    decision = "freeze_learning_applied";
  }

  const recommendation =
    decision === "healthy"
      ? "Fusion governance: within normal Fusion-local bounds."
      : decision === "rollback_recommended"
        ? "Advisory: consider reducing Fusion-primary reliance until fallback rates improve (Fusion-local only)."
        : decision === "require_human_review"
          ? "Advisory: human review suggested for Fusion governance signals."
          : `Governance state: ${decision} — review Fusion-local metrics.`;

  const status: GlobalFusionGovernanceStatus = {
    decision,
    recommendation,
    warnings,
    metrics,
    thresholdState: ts,
    reasons,
    notes,
    freezeDecision,
  };

  const rollbackSignal = buildGlobalFusionRollbackSignal(status);
  if (rollbackSignal) {
    status.rollbackSignal = rollbackSignal;
  }

  if (globalFusionFlags.globalFusionAutoFreezeV1) {
    if (freezeDecision.learningFreezeRecommended && !freezeBefore.learningFrozen) {
      applyGlobalFusionFreeze({
        learning: true,
        reason: `governance:${decision}`,
      });
      recordFreezeToggle();
      freezeDecision.learningFreezeApplied = true;
      if (decision === "freeze_learning_recommended") decision = "freeze_learning_applied";
    }
    if (freezeDecision.influenceFreezeRecommended && !freezeBefore.influenceFrozen) {
      applyGlobalFusionFreeze({
        influence: true,
        reason: `governance:${decision}`,
      });
      recordFreezeToggle();
      freezeDecision.influenceFreezeApplied = true;
    }
    status.freezeDecision = freezeDecision;
  }

  const snap: GlobalFusionGovernanceSnapshot = {
    evaluatedAt: new Date().toISOString(),
    status: { ...status, decision },
    governanceEnabled: true,
    autoFreezeEnabled: globalFusionFlags.globalFusionAutoFreezeV1,
    autoRollbackSignalEnabled: globalFusionFlags.globalFusionAutoRollbackSignalV1,
  };

  recordGovernanceEvaluation(snap);
  logInfo("[global:fusion:governance]", {
    event: "evaluation",
    decision: snap.status.decision,
    fallbackRate: metrics.fallbackRate,
    weightDrift: metrics.weightDrift,
  });

  return snap;
}

/** Best-effort governance pass; safe to call after monitoring updates. Never throws. */
export function tryEvaluateGovernance(): void {
  try {
    if (!globalFusionFlags.globalFusionGovernanceV1) return;
    evaluateGlobalFusionGovernance();
  } catch {
    /* governance must not break callers */
  }
}
