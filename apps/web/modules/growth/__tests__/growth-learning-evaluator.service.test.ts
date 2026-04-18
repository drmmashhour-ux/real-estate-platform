import { describe, expect, it } from "vitest";
import { evaluateGrowthLearning } from "../growth-learning-evaluator.service";

describe("evaluateGrowthLearning", () => {
  it("computes stable rates for usable outcomes", () => {
    const outcomes = [
      { signalId: "a", outcomeType: "positive" as const, rationale: "x", observedAt: "t" },
      { signalId: "b", outcomeType: "positive" as const, rationale: "x", observedAt: "t" },
      { signalId: "c", outcomeType: "negative" as const, rationale: "x", observedAt: "t" },
      { signalId: "d", outcomeType: "neutral" as const, rationale: "x", observedAt: "t" },
      { signalId: "e", outcomeType: "neutral" as const, rationale: "x", observedAt: "t" },
      { signalId: "f", outcomeType: "insufficient_data" as const, rationale: "x", observedAt: "t" },
    ];
    const s = evaluateGrowthLearning({ outcomes, runIndex: 3 });
    expect(s.runs).toBe(3);
    expect(s.signalsEvaluated).toBe(6);
    expect(s.outcomesLinked).toBe(5);
    expect(s.positiveRate + s.negativeRate + s.neutralRate).toBeCloseTo(1, 5);
  });

  it("flags low evidence for tiny samples", () => {
    const s = evaluateGrowthLearning({
      outcomes: [
        { signalId: "a", outcomeType: "positive", rationale: "x", observedAt: "t" },
        { signalId: "b", outcomeType: "negative", rationale: "x", observedAt: "t" },
      ],
      runIndex: 1,
    });
    expect(s.warnings.some((w) => w.includes("low_evidence"))).toBe(true);
  });
});
