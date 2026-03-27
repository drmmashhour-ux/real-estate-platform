import { describe, expect, it } from "vitest";
import {
  collectNextBestActionsFromRuleResults,
  flattenSignalsFromRuleResults,
} from "@/lib/trustgraph/application/generateNextBestActions";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

describe("generateNextBestActions", () => {
  it("flattens signals in rule order", () => {
    const results: RuleEvaluationResult[] = [
      {
        ruleCode: "a",
        ruleVersion: "1",
        passed: false,
        scoreDelta: 0,
        confidence: 1,
        details: {},
        signals: [
          {
            signalCode: "S1",
            signalName: "n",
            category: "address",
            severity: "low",
            scoreImpact: 0,
            confidence: 1,
            evidence: {},
            message: "m1",
          },
        ],
      },
      {
        ruleCode: "b",
        ruleVersion: "1",
        passed: false,
        scoreDelta: 0,
        confidence: 1,
        details: {},
        signals: [
          {
            signalCode: "S2",
            signalName: "n2",
            category: "media",
            severity: "medium",
            scoreImpact: 0,
            confidence: 1,
            evidence: {},
            message: "m2",
          },
        ],
      },
    ];
    const flat = flattenSignalsFromRuleResults(results);
    expect(flat.map((s) => s.signalCode)).toEqual(["S1", "S2"]);
  });

  it("dedupes next actions by actionCode", () => {
    const results: RuleEvaluationResult[] = [
      {
        ruleCode: "a",
        ruleVersion: "1",
        passed: false,
        scoreDelta: 0,
        confidence: 1,
        details: {},
        recommendedActions: [
          {
            actionCode: "FIX_ADDR",
            title: "Fix",
            description: "d",
            priority: "high",
            actorType: "user",
          },
        ],
      },
      {
        ruleCode: "b",
        ruleVersion: "1",
        passed: false,
        scoreDelta: 0,
        confidence: 1,
        details: {},
        recommendedActions: [
          {
            actionCode: "FIX_ADDR",
            title: "Other",
            description: "d2",
            priority: "medium",
            actorType: "user",
          },
        ],
      },
    ];
    const actions = collectNextBestActionsFromRuleResults(results);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.title).toBe("Fix");
  });
});
