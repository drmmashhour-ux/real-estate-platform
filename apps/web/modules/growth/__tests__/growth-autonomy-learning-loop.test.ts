import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const learningFlag = vi.hoisted(() => ({ on: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthAutonomyFlags: {
      ...a.growthAutonomyFlags,
      get growthAutonomyLearningV1() {
        return learningFlag.on;
      },
    },
  };
});

const getRow = vi.fn();
const upsert = vi.fn();

vi.mock("../growth-autonomy-learning.repository", () => ({
  getGrowthAutonomyLearningStateRow: (...a: unknown[]) => getRow(...a),
  upsertGrowthAutonomyLearningState: (...a: unknown[]) => upsert(...a),
  appendGrowthAutonomyLearningRecord: vi.fn(),
  bumpCategoryAggregate: vi.fn(),
}));

vi.mock("../growth-autonomy-learning-monitoring.service", () => ({
  recordLearningCycle: vi.fn(),
  recordLearningRecordCreated: vi.fn(),
  recordLearningDisabledSkip: vi.fn(),
}));

function emptyAgg() {
  return {
    shown: 0,
    interacted: 0,
    prefillUsed: 0,
    completed: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    confusion: 0,
    ignored: 0,
  };
}

describe("runGrowthAutonomyLearningCycle", () => {
  beforeEach(() => {
    learningFlag.on = true;
    getRow.mockReset();
    upsert.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when FEATURE learning is off", async () => {
    learningFlag.on = false;
    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();
    expect(getRow).not.toHaveBeenCalled();
  });

  it("sparse aggregates skip weight moves (insufficient_data across catalog)", async () => {
    getRow.mockResolvedValue({
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
      aggregatesByCategory: {},
      controlFlags: { frozen: false },
      lastLearningRunAt: null,
    });

    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();

    expect(upsert).toHaveBeenCalled();
    const payload = upsert.mock.calls[0][0];
    expect(payload.weightDeltasByCategory["cat-strategy-promo"]).toBeUndefined();
  });

  it("applies bounded priority increase on strong positive signals", async () => {
    getRow.mockResolvedValue({
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
      aggregatesByCategory: {
        "cat-strategy-promo": {
          shown: 20,
          interacted: 14,
          prefillUsed: 0,
          completed: 9,
          helpfulYes: 18,
          helpfulNo: 0,
          confusion: 0,
          ignored: 0,
        },
      },
      controlFlags: { frozen: false },
      lastLearningRunAt: null,
    });

    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();

    const payload = upsert.mock.calls[0][0];
    const w = payload.weightDeltasByCategory["cat-strategy-promo"];
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThanOrEqual(0.06);
  });

  it("clamps cumulative weight delta to guardrail max increase", async () => {
    process.env.GROWTH_AUTONOMY_LEARNING_MAX_UP = "0.06";
    process.env.GROWTH_AUTONOMY_LEARNING_STEP_UP = "0.05";
    getRow.mockResolvedValue({
      weightDeltasByCategory: { "cat-strategy-promo": 0.058 },
      suppressedUntilByCategory: {},
      aggregatesByCategory: {
        "cat-strategy-promo": {
          shown: 20,
          interacted: 14,
          completed: 9,
          helpfulYes: 18,
          helpfulNo: 0,
          confusion: 0,
          ignored: 0,
          prefillUsed: 0,
        },
      },
      controlFlags: { frozen: false },
      lastLearningRunAt: null,
    });

    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();

    const payload = upsert.mock.calls[0][0];
    expect(payload.weightDeltasByCategory["cat-strategy-promo"]).toBe(0.06);
    delete process.env.GROWTH_AUTONOMY_LEARNING_MAX_UP;
    delete process.env.GROWTH_AUTONOMY_LEARNING_STEP_UP;
  });

  it("temporary suppression + decrease on repeated poor + ignored pattern", async () => {
    const now = Date.now();
    getRow.mockResolvedValue({
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
      aggregatesByCategory: {
        "cat-strategy-promo": {
          shown: 20,
          interacted: 1,
          prefillUsed: 0,
          completed: 0,
          helpfulYes: 0,
          helpfulNo: 12,
          confusion: 2,
          ignored: 15,
        },
      },
      controlFlags: { frozen: false },
      lastLearningRunAt: null,
    });

    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();

    const payload = upsert.mock.calls[0][0];
    expect(payload.suppressedUntilByCategory["cat-strategy-promo"]).toBeGreaterThan(now);
    expect(payload.weightDeltasByCategory["cat-strategy-promo"]).toBeLessThanOrEqual(0);
  });

  it("does not upsert adjustments when frozen", async () => {
    getRow.mockResolvedValue({
      weightDeltasByCategory: { "cat-strategy-promo": 0.02 },
      suppressedUntilByCategory: {},
      aggregatesByCategory: {
        "cat-strategy-promo": {
          shown: 20,
          interacted: 14,
          completed: 9,
          helpfulYes: 18,
          helpfulNo: 0,
          confusion: 0,
          ignored: 0,
          prefillUsed: 0,
        },
      },
      controlFlags: { frozen: true },
      lastLearningRunAt: null,
    });

    vi.resetModules();
    const { runGrowthAutonomyLearningCycle } = await import("../growth-autonomy-learning.service");
    await runGrowthAutonomyLearningCycle();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("loadGrowthAutonomyLearningOrchestrationContext", () => {
  beforeEach(() => {
    learningFlag.on = true;
    getRow.mockReset();
  });

  it("disables adaptive influence when kill switch is active", async () => {
    vi.resetModules();
    const { loadGrowthAutonomyLearningOrchestrationContext } = await import("../growth-autonomy-learning.service");
    const ctx = await loadGrowthAutonomyLearningOrchestrationContext({ killSwitchActive: true });
    expect(ctx.adaptiveInfluenceAllowed).toBe(false);
    expect(getRow).not.toHaveBeenCalled();
  });

  it("disables adaptive influence when learning flag off", async () => {
    learningFlag.on = false;
    vi.resetModules();
    const { loadGrowthAutonomyLearningOrchestrationContext } = await import("../growth-autonomy-learning.service");
    const ctx = await loadGrowthAutonomyLearningOrchestrationContext({ killSwitchActive: false });
    expect(ctx.adaptiveInfluenceAllowed).toBe(false);
  });
});

describe("computeEffectivenessForCategory", () => {
  it("returns insufficient_data when observations are below minimum", async () => {
    const { computeEffectivenessForCategory } = await import("../growth-autonomy-effectiveness.service");
    const eff = computeEffectivenessForCategory({
      category: "strategy",
      aggregate: { ...emptyAgg(), shown: 5 },
    });
    expect(eff.band).toBe("insufficient_data");
  });
});

describe("explainLearningDecision", () => {
  it("is deterministic for the same inputs", async () => {
    const { explainLearningDecision } = await import("../growth-autonomy-learning-explainer.service");
    const args = {
      categoryLabel: "Content",
      decision: "increase_priority" as const,
      effectiveness: {
        category: "content" as const,
        band: "strong" as const,
        numericScore: 0.8,
        interactionRate: 0.5,
        completionRate: 0.2,
        observationCount: 30,
      },
    };
    expect(explainLearningDecision(args)).toBe(explainLearningDecision(args));
  });
});

describe("applyGrowthAutonomyLearning", () => {
  it("never hides blocked rows — blocked stays above advisory in sort order", async () => {
    const { applyGrowthAutonomyLearning } = await import("../growth-autonomy-learning-apply.service");
    const suggestions = [
      {
        id: "cat-strategy-promo",
        label: "A",
        disposition: "suggest_only" as const,
        confidence: 0.9,
        allowed: true,
        explanation: "",
        actionType: "suggest_strategy_promotion" as const,
        enforcementTargetMode: "allow" as const,
        enforcementTargetKey: "strategy_recommendation_promotion",
        policyNote: "",
        targetKey: "strategy_recommendation_promotion",
      },
      {
        id: "cat-content",
        label: "B",
        disposition: "blocked" as const,
        confidence: 0.5,
        allowed: false,
        explanation: "",
        actionType: "suggest_content_improvement" as const,
        enforcementTargetMode: "block" as const,
        enforcementTargetKey: "content_assist_generation",
        policyNote: "",
        targetKey: "content_assist_generation",
      },
    ];

    const out = applyGrowthAutonomyLearning({
      suggestions,
      counts: { surfaced: 2, blocked: 1, approvalRequired: 0, hidden: 0, prefilled: 0 },
      weightDeltasByCategory: { "cat-strategy-promo": 0.5 },
      suppressedUntilByCategory: {},
      learningActive: true,
    });

    expect(out.suggestions[0].disposition).toBe("blocked");
  });
});
