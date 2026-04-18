/**
 * Phase F governance observability — [global:fusion:governance]; read-only counters.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { GlobalFusionGovernanceSnapshot } from "./global-fusion.types";

const NS = "[global:fusion:governance]";

type GovMon = {
  evaluationsCount: number;
  freezeRecommendationsCount: number;
  freezeAppliedCount: number;
  rollbackRecommendationsCount: number;
  requireHumanReviewCount: number;
  thresholdBreachByCategory: Record<string, number>;
  lastSnapshot: GlobalFusionGovernanceSnapshot | null;
  consecutiveCautionOrWorse: number;
  freezeToggleEvents: number;
};

let gm: GovMon = {
  evaluationsCount: 0,
  freezeRecommendationsCount: 0,
  freezeAppliedCount: 0,
  rollbackRecommendationsCount: 0,
  requireHumanReviewCount: 0,
  thresholdBreachByCategory: {},
  lastSnapshot: null,
  consecutiveCautionOrWorse: 0,
  freezeToggleEvents: 0,
};

export function recordGovernanceEvaluation(snap: GlobalFusionGovernanceSnapshot): void {
  try {
    gm.evaluationsCount++;
    gm.lastSnapshot = snap;
    const d = snap.status.decision;
    if (
      d === "freeze_learning_recommended" ||
      d === "freeze_learning_applied" ||
      snap.status.freezeDecision?.learningFreezeRecommended
    ) {
      gm.freezeRecommendationsCount++;
    }
    if (d === "freeze_learning_applied" || snap.status.freezeDecision?.learningFreezeApplied) {
      gm.freezeAppliedCount++;
    }
    if (d === "rollback_recommended") {
      gm.rollbackRecommendationsCount++;
    }
    if (d === "require_human_review") {
      gm.requireHumanReviewCount++;
    }
    if (d === "healthy" || d === "watch") {
      gm.consecutiveCautionOrWorse = 0;
    } else {
      gm.consecutiveCautionOrWorse++;
    }
    logInfo(NS, {
      event: "evaluation_complete",
      decision: d,
      rollback: snap.status.rollbackSignal?.level,
      freezeLearning: snap.status.freezeDecision?.learningFreezeRecommended,
    });
    if (gm.consecutiveCautionOrWorse > 8 && d !== "healthy") {
      logWarn(NS, { event: "observation", kind: "sustained_elevated_governance_state" });
    }
    if (gm.freezeToggleEvents > 20) {
      logWarn(NS, { event: "observation", kind: "repeated_freeze_toggling" });
    }
  } catch {
    /* noop */
  }
}

export function recordThresholdBreach(category: string): void {
  try {
    gm.thresholdBreachByCategory[category] = (gm.thresholdBreachByCategory[category] ?? 0) + 1;
  } catch {
    /* noop */
  }
}

export function recordFreezeToggle(): void {
  try {
    gm.freezeToggleEvents++;
  } catch {
    /* noop */
  }
}

export function getLastGovernanceSnapshot(): GlobalFusionGovernanceSnapshot | null {
  return gm.lastSnapshot;
}

export function getGovernanceMonitoringSummary(): {
  evaluationsCount: number;
  freezeRecommendationsCount: number;
  freezeAppliedCount: number;
  rollbackRecommendationsCount: number;
  requireHumanReviewCount: number;
  thresholdBreachByCategory: Record<string, number>;
  lastSnapshot: GlobalFusionGovernanceSnapshot | null;
  consecutiveCautionOrWorse: number;
} {
  return {
    evaluationsCount: gm.evaluationsCount,
    freezeRecommendationsCount: gm.freezeRecommendationsCount,
    freezeAppliedCount: gm.freezeAppliedCount,
    rollbackRecommendationsCount: gm.rollbackRecommendationsCount,
    requireHumanReviewCount: gm.requireHumanReviewCount,
    thresholdBreachByCategory: { ...gm.thresholdBreachByCategory },
    lastSnapshot: gm.lastSnapshot,
    consecutiveCautionOrWorse: gm.consecutiveCautionOrWorse,
  };
}

export function getConsecutiveCautionOrWorse(): number {
  return gm.consecutiveCautionOrWorse;
}

export function resetGlobalFusionGovernanceMonitoringForTests(): void {
  gm = {
    evaluationsCount: 0,
    freezeRecommendationsCount: 0,
    freezeAppliedCount: 0,
    rollbackRecommendationsCount: 0,
    requireHumanReviewCount: 0,
    thresholdBreachByCategory: {},
    lastSnapshot: null,
    consecutiveCautionOrWorse: 0,
    freezeToggleEvents: 0,
  };
}
