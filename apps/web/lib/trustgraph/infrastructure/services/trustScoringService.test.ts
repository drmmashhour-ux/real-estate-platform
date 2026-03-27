import { describe, expect, it } from "vitest";
import { trustScoringService } from "@/lib/trustgraph/infrastructure/services/trustScoringService";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

describe("trustScoringService", () => {
  it("computes outcome with score breakdown", () => {
    const results: RuleEvaluationResult[] = [
      { ruleCode: "a", ruleVersion: "1", passed: true, scoreDelta: 10, confidence: 1, details: {} },
    ];
    const o = trustScoringService.computeOutcome(results);
    expect(o.overallScore).toBe(60);
    expect(o.trustLevel).toBe("high");
    expect(o.scoreBreakdown.rules).toHaveLength(1);
    expect(o.scoreBreakdown.aggregateScore).toBe(60);
  });
});
