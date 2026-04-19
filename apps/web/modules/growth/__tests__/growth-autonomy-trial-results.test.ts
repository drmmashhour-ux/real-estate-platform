import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  appendGrowthAutonomyTrialAudit,
  listGrowthAutonomyTrialAuditTrail,
  resetGrowthAutonomyTrialAuditForTests,
} from "../growth-autonomy-trial-audit.service";
import { evaluateAdjacentTrialExpansionGovernanceLock } from "../growth-autonomy-trial-expansion-lock.service";
import { resolveGrowthAutonomyTrialDecision } from "../growth-autonomy-trial-decision.service";
import { evaluateGrowthAutonomyTrialSafety } from "../growth-autonomy-trial-safety-evaluation.service";
import { scoreGrowthAutonomyTrialUsefulness } from "../growth-autonomy-trial-usefulness.service";
import {
  ADJACENT_INTERNAL_TRIAL_ACTION_ID,
  ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
} from "../growth-autonomy-trial-boundaries";
import { resetGrowthAutonomyTrialOutcomeSummaryForTests } from "../growth-autonomy-trial-results-state.repository";
import { resetGrowthAutonomyTrialFeedbackForTests } from "../growth-autonomy-trial-feedback.service";
import { resetGrowthAutonomyMonitoringForTests } from "../growth-autonomy-monitoring.service";
import { resetGrowthAutonomyTrialResultsMonitoringForTests } from "../growth-autonomy-trial-results-monitoring.service";
import {
  recordGrowthAutonomyTrialOperatorFeedback,
} from "../growth-autonomy-trial-feedback.service";

const trialFlags = vi.hoisted(() => ({ trialV1: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthAutonomyFlags: {
      ...a.growthAutonomyFlags,
      get growthAutonomyTrialV1() {
        return trialFlags.trialV1;
      },
    },
  };
});

describe("growth-autonomy-trial-results governance", () => {
  beforeEach(() => {
    resetGrowthAutonomyTrialAuditForTests();
    resetGrowthAutonomyTrialFeedbackForTests();
    resetGrowthAutonomyTrialOutcomeSummaryForTests();
    resetGrowthAutonomyMonitoringForTests();
    resetGrowthAutonomyTrialResultsMonitoringForTests();
    trialFlags.trialV1 = true;
  });

  it("expansion lock active until measurement exists after trial executed", () => {
    appendGrowthAutonomyTrialAudit({
      kind: "execution_completed",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      payload: { artifactId: "x" },
    });
    const before = evaluateAdjacentTrialExpansionGovernanceLock({
      trialFeatureOn: true,
      trialEverExecuted: true,
      trialOutcomeMeasured: false,
    });
    expect(before.blocksExpansionApprovals).toBe(true);

    const after = evaluateAdjacentTrialExpansionGovernanceLock({
      trialFeatureOn: true,
      trialEverExecuted: true,
      trialOutcomeMeasured: true,
    });
    expect(after.blocksExpansionApprovals).toBe(true);
    expect(after.reason).toContain("governance");
  });

  it("sparse usefulness => insufficient_data decision path", () => {
    const r = resolveGrowthAutonomyTrialDecision({
      safety: { level: "safe", reasons: [], auditGapSuspected: false, killOrFreezeDuringWindow: false },
      usefulness: "insufficient_data",
      sparseData: true,
      sampleSize: 2,
    });
    expect(r.decision).toBe("insufficient_data");
  });

  it("unsafe safety => rollback", () => {
    const r = resolveGrowthAutonomyTrialDecision({
      safety: {
        level: "unsafe",
        reasons: ["Multiple rollback completions recorded — operator churn risk.", "x"],
        auditGapSuspected: true,
        killOrFreezeDuringWindow: false,
      },
      usefulness: "good",
      sparseData: false,
      sampleSize: 12,
    });
    expect(r.decision).toBe("rollback");
  });

  it("safe + strong + sample => eligible_for_future_review", () => {
    const r = resolveGrowthAutonomyTrialDecision({
      safety: { level: "safe", reasons: [], auditGapSuspected: false, killOrFreezeDuringWindow: false },
      usefulness: "strong",
      sparseData: false,
      sampleSize: 6,
    });
    expect(r.decision).toBe("eligible_for_future_review");
  });

  it("safe + weak usefulness => hold", () => {
    const r = resolveGrowthAutonomyTrialDecision({
      safety: { level: "safe", reasons: [], auditGapSuspected: false, killOrFreezeDuringWindow: false },
      usefulness: "weak",
      sparseData: false,
      sampleSize: 8,
    });
    expect(r.decision).toBe("hold");
  });

  it("safety evaluation marks unsafe when audit gap is suspected (executions exceed approvals + 1)", () => {
    appendGrowthAutonomyTrialAudit({
      kind: "approved",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    });
    for (let i = 0; i < 3; i++) {
      appendGrowthAutonomyTrialAudit({
        kind: "execution_completed",
        trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
        candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      });
    }
    const audit = listGrowthAutonomyTrialAuditTrail().filter((e) => e.trialActionId === ADJACENT_INTERNAL_TRIAL_ACTION_ID);
    const fb = {
      helpful: 0,
      notHelpful: 0,
      confusing: 0,
      undoneUnnecessary: 0,
      rolledBackProblematic: 0,
      total: 0,
      positiveRate: null,
      confusionRate: null,
      undoIntentRate: null,
    };
    const mon = {
      snapshotsBuilt: 0,
      suggestionsSurfaced: 0,
      suggestionsBlocked: 0,
      approvalRequiredOutcomes: 0,
      partialSnapshotCases: 0,
      hiddenByMode: 0,
      autonomyApiReads: 0,
      prefillTelemetryEvents: 0,
      validationChecklistCompletions: 0,
      validationTelemetryEvents: 0,
      trialSnapshotsEvaluated: 3,
      trialActivationsCompleted: 1,
      trialApprovalsRecorded: 1,
      trialDenialsRecorded: 0,
      trialRollbacksStarted: 2,
      trialRollbacksCompleted: 2,
      trialKillFreezeBlocks: 0,
    };
    const s = evaluateGrowthAutonomyTrialSafety({
      auditEntries: audit,
      monitoring: mon,
      feedback: fb,
    });
    expect(s.level).toBe("unsafe");
  });

  it("scoreGrowthAutonomyTrialUsefulness returns insufficient_data when sparse", () => {
    expect(
      scoreGrowthAutonomyTrialUsefulness({
        feedback: {
          helpful: 1,
          notHelpful: 0,
          confusing: 0,
          undoneUnnecessary: 0,
          rolledBackProblematic: 0,
          total: 1,
          positiveRate: 1,
          confusionRate: 0,
          undoIntentRate: 0,
        },
        undoRollbackRate: 0,
        sparseData: true,
      }),
    ).toBe("insufficient_data");
  });

  it("computeGrowthAutonomyTrialOutcomeSummary returns null without execution audit", async () => {
    const { computeGrowthAutonomyTrialOutcomeSummary } = await import("../growth-autonomy-trial-results.service");
    expect(computeGrowthAutonomyTrialOutcomeSummary()).toBeNull();
  });

  it("computeGrowthAutonomyTrialOutcomeSummary yields insufficient_data with sparse interaction", async () => {
    appendGrowthAutonomyTrialAudit({
      kind: "approved",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      actorUserId: "u1",
    });
    appendGrowthAutonomyTrialAudit({
      kind: "execution_completed",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
      payload: { artifactId: "a1" },
    });

    const { computeGrowthAutonomyTrialOutcomeSummary } = await import("../growth-autonomy-trial-results.service");
    const summary = computeGrowthAutonomyTrialOutcomeSummary();
    expect(summary).not.toBeNull();
    expect(summary?.finalDecision).toBe("insufficient_data");
  });

  it("feedback improves usefulness band deterministically", async () => {
    appendGrowthAutonomyTrialAudit({
      kind: "approved",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    });
    appendGrowthAutonomyTrialAudit({
      kind: "execution_completed",
      trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
      candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    });
    for (let i = 0; i < 8; i++) {
      recordGrowthAutonomyTrialOperatorFeedback({
        trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
        candidateActionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
        kind: "helpful",
        actorUserId: "op",
      });
    }

    const { computeGrowthAutonomyTrialOutcomeSummary } = await import("../growth-autonomy-trial-results.service");
    const summary = computeGrowthAutonomyTrialOutcomeSummary();
    expect(summary?.operatorFeedback.helpful).toBe(8);
    expect(summary?.usefulnessBand === "strong" || summary?.usefulnessBand === "good").toBe(true);
  });
});
