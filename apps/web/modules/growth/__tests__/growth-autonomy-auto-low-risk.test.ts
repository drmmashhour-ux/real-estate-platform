import { describe, it, expect, vi, beforeEach } from "vitest";

import { getAllowlistedAutoAction } from "../growth-autonomy-auto-allowlist";
import { explainSafeAutoExecutionAllowed } from "../growth-autonomy-execution-explainer.service";
import { computeAutoLowRiskCohortBucket } from "../growth-autonomy-auto-cohort";
import type { GrowthAutonomyLearningOrchestrationContext } from "../growth-autonomy-learning.service";
import {
  getGrowthAutonomyExecutionMonitoringSnapshot,
  recordExecutionAttempt,
  resetGrowthAutonomyExecutionMonitoringForTests,
} from "../growth-autonomy-execution-monitoring.service";

const autoLowRiskFlag = vi.hoisted(() => ({ on: true }));
const killFlag = vi.hoisted(() => ({ on: false }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthAutonomyFlags: {
      ...a.growthAutonomyFlags,
      get growthAutonomyAutoLowRiskV1() {
        return autoLowRiskFlag.on;
      },
      get growthAutonomyLearningV1() {
        return true;
      },
      get growthAutonomyKillSwitch() {
        return killFlag.on;
      },
    },
  };
});

vi.mock("../growth-autonomy-learning.repository", () => ({
  getGrowthAutonomyLearningStateRow: vi.fn(async () => ({
    weightDeltasByCategory: {},
    suppressedUntilByCategory: {},
    aggregatesByCategory: {
      "cat-strategy-promo": {
        shown: 30,
        interacted: 12,
        prefillUsed: 0,
        completed: 6,
        helpfulYes: 10,
        helpfulNo: 2,
        confusion: 0,
        ignored: 2,
      },
    },
    controlFlags: { frozen: false },
    lastLearningRunAt: null,
  })),
}));

vi.mock("../growth-autonomy-learning.service", () => ({
  GrowthAutonomyLearningOrchestrationContext: {},
}));

describe("low-risk allowlist + copy", () => {
  it("does not allowlist navigation-only prefills for server auto", () => {
    expect(getAllowlistedAutoAction("cat-prefill")).toBeUndefined();
  });

  it("explainer is deterministic for same args", () => {
    const a = explainSafeAutoExecutionAllowed({
      catalogLabel: "Test",
      lowRiskActionKey: "create_internal_review_task",
      rolloutStageLabel: "internal",
    });
    expect(explainSafeAutoExecutionAllowed({
      catalogLabel: "Test",
      lowRiskActionKey: "create_internal_review_task",
      rolloutStageLabel: "internal",
    })).toBe(a);
  });

  it("cohort buckets are stable per user id", () => {
    expect(computeAutoLowRiskCohortBucket("user-a")).toBe(computeAutoLowRiskCohortBucket("user-a"));
  });
});

const testLearnCtx: GrowthAutonomyLearningOrchestrationContext = {
  adaptiveInfluenceAllowed: true,
  weightDeltasByCategory: {},
  suppressedUntilByCategory: {},
};

describe("enrichGrowthAutonomySuggestionsWithAutoExecution", () => {
  beforeEach(() => {
    autoLowRiskFlag.on = true;
    killFlag.on = false;
  });

  it("promotes allowlisted row to auto_low_risk under SAFE_AUTOPILOT when gates pass", async () => {
    const { enrichGrowthAutonomySuggestionsWithAutoExecution } = await import("../growth-autonomy-auto-execution.service");

    const suggestion = {
      id: "cat-strategy-promo",
      actionType: "suggest_strategy_promotion" as const,
      label: "Review strategy",
      targetKey: "strategy_recommendation_promotion",
      explanation: { whySuggested: "a", whyBlockedOrAllowed: "b", whatNext: "c" },
      confidence: 0.72,
      enforcementTargetMode: "allow" as const,
      enforcementTargetKey: "strategy_recommendation_promotion",
      disposition: "prefilled_only" as const,
      allowed: true,
      policyNote: "",
    };

    const out = await enrichGrowthAutonomySuggestionsWithAutoExecution({
      suggestions: [suggestion],
      autonomyMode: "SAFE_AUTOPILOT",
      autonomyRolloutStage: "partial",
      killSwitchActive: false,
      autoRolloutStage: "internal",
      autoLowRiskFlagOn: true,
      enforcementInputPartial: false,
      learnCtx: testLearnCtx,
      viewerMayReceiveAutoExecution: true,
      cohortBucket: "auto_low_risk",
    });

    expect(out.suggestions[0]?.execution?.resolvedExecutionClass).toBe("auto_low_risk");
  });

  it("never promotes when autonomy mode is ASSIST", async () => {
    const { enrichGrowthAutonomySuggestionsWithAutoExecution } = await import("../growth-autonomy-auto-execution.service");

    const suggestion = {
      id: "cat-strategy-promo",
      actionType: "suggest_strategy_promotion" as const,
      label: "Review strategy",
      targetKey: "strategy_recommendation_promotion",
      explanation: { whySuggested: "a", whyBlockedOrAllowed: "b", whatNext: "c" },
      confidence: 0.72,
      enforcementTargetMode: "allow" as const,
      enforcementTargetKey: "strategy_recommendation_promotion",
      disposition: "suggest_only" as const,
      allowed: true,
      policyNote: "",
    };

    const out = await enrichGrowthAutonomySuggestionsWithAutoExecution({
      suggestions: [suggestion],
      autonomyMode: "ASSIST",
      autonomyRolloutStage: "partial",
      killSwitchActive: false,
      autoRolloutStage: "internal",
      autoLowRiskFlagOn: true,
      enforcementInputPartial: false,
      learnCtx: testLearnCtx,
      viewerMayReceiveAutoExecution: true,
      cohortBucket: "auto_low_risk",
    });

    expect(out.suggestions[0]?.execution?.resolvedExecutionClass).not.toBe("auto_low_risk");
  });
});

describe("execution monitoring", () => {
  beforeEach(() => {
    resetGrowthAutonomyExecutionMonitoringForTests();
  });

  it("reset clears counters", () => {
    recordExecutionAttempt();
    expect(getGrowthAutonomyExecutionMonitoringSnapshot().attempted).toBe(1);
    resetGrowthAutonomyExecutionMonitoringForTests();
    expect(getGrowthAutonomyExecutionMonitoringSnapshot().attempted).toBe(0);
  });
});
