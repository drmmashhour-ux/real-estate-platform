import { describe, expect, it } from "vitest";
import {
  aggregateScoreFromRules,
  buildScoreBreakdown,
  clampScore,
  readinessFromRules,
  trustLevelFromScore,
} from "@/lib/trustgraph/domain/scoring";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

describe("scoring", () => {
  it("clamps score", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(42)).toBe(42);
  });

  it("maps trust levels", () => {
    expect(trustLevelFromScore(90)).toBe("verified");
    expect(trustLevelFromScore(70)).toBe("high");
    expect(trustLevelFromScore(40)).toBe("medium");
    expect(trustLevelFromScore(10)).toBe("low");
  });

  it("aggregates rule deltas from base 50", () => {
    const results: RuleEvaluationResult[] = [
      { ruleCode: "a", ruleVersion: "1", passed: true, scoreDelta: 10, confidence: 1, details: {} },
      { ruleCode: "b", ruleVersion: "1", passed: true, scoreDelta: -5, confidence: 1, details: {} },
    ];
    expect(aggregateScoreFromRules(results)).toBe(55);
    const bd = buildScoreBreakdown(results);
    expect(bd.version).toBe("1");
    expect(bd.baseScore).toBe(50);
    expect(bd.aggregateScore).toBe(55);
    expect(bd.rules).toHaveLength(2);
  });

  it("readiness action_required when critical signal", () => {
    const results: RuleEvaluationResult[] = [
      {
        ruleCode: "x",
        ruleVersion: "1",
        passed: false,
        scoreDelta: -10,
        confidence: 1,
        details: {},
        signals: [
          {
            signalCode: "c",
            signalName: "c",
            category: "fraud",
            severity: "critical",
            scoreImpact: -10,
            confidence: 1,
            evidence: {},
            message: "m",
          },
        ],
      },
    ];
    expect(readinessFromRules(results)).toBe("action_required");
  });
});
