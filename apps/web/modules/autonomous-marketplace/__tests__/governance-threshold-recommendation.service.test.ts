import { describe, expect, it } from "vitest";

import { recommendGovernanceThresholdAdjustments } from "../feedback/governance-threshold-recommendation.service";
import type { GovernanceFeedbackResult } from "../feedback/governance-feedback.types";

function synthetic(label: GovernanceFeedbackResult["label"]): GovernanceFeedbackResult {
  return {
    label,
    confidence: "MEDIUM",
    falsePositive: label === "BAD_BLOCK",
    falseNegative: ["MISSED_RISK", "BAD_EXECUTION", "BAD_APPROVAL"].includes(label),
    protectedRevenueEstimate: 0,
    leakedRevenueEstimate: 0,
    reasons: [],
    recommendedActions: [],
  };
}

describe("governance-threshold-recommendation.service", () => {
  it("high bad-block rate => increase medium threshold recommendation", () => {
    const results = Array.from({ length: 10 }, () => synthetic("BAD_BLOCK"));
    const summary = {
      totalCases: 10,
      goodBlocks: 0,
      badBlocks: 10,
      goodApprovals: 0,
      badApprovals: 0,
      goodExecutions: 0,
      badExecutions: 0,
      missedRiskCases: 0,
      falsePositiveRate: 1,
      falseNegativeRate: 0,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
    };
    const recs = recommendGovernanceThresholdAdjustments({ summary, results });
    expect(recs.some((r) => r.metricKey === "combinedRisk.mediumThreshold" && r.direction === "increase")).toBe(
      true,
    );
  });

  it("high missed-risk rate => decrease high threshold recommendation", () => {
    const results = Array.from({ length: 10 }, () => synthetic("MISSED_RISK"));
    const summary = {
      totalCases: 10,
      goodBlocks: 0,
      badBlocks: 0,
      goodApprovals: 0,
      badApprovals: 0,
      goodExecutions: 0,
      badExecutions: 0,
      missedRiskCases: 10,
      falsePositiveRate: 0,
      falseNegativeRate: 1,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
    };
    const recs = recommendGovernanceThresholdAdjustments({ summary, results });
    expect(recs.some((r) => r.metricKey === "combinedRisk.highThreshold" && r.direction === "decrease")).toBe(true);
  });

  it("no strong signal => hold recommendation", () => {
    const results = Array.from({ length: 5 }, () => synthetic("GOOD_EXECUTION"));
    const summary = {
      totalCases: 5,
      goodBlocks: 0,
      badBlocks: 0,
      goodApprovals: 0,
      badApprovals: 0,
      goodExecutions: 5,
      badExecutions: 0,
      missedRiskCases: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      protectedRevenueEstimate: 100,
      leakedRevenueEstimate: 50,
    };
    const recs = recommendGovernanceThresholdAdjustments({ summary, results });
    expect(recs.some((r) => r.direction === "hold")).toBe(true);
  });
});
