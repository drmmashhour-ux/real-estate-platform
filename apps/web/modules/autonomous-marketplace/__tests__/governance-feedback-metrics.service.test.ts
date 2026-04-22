import { describe, expect, it } from "vitest";

import { buildGovernancePerformanceSummary } from "../feedback/governance-feedback-metrics.service";
import type { GovernanceFeedbackResult } from "../feedback/governance-feedback.types";

function row(
  label: GovernanceFeedbackResult["label"],
  fp: boolean,
  fn: boolean,
  protectedAmt: number,
  leaked: number,
): GovernanceFeedbackResult {
  return {
    label,
    confidence: "MEDIUM",
    falsePositive: fp,
    falseNegative: fn,
    protectedRevenueEstimate: protectedAmt,
    leakedRevenueEstimate: leaked,
    reasons: [],
    recommendedActions: [],
  };
}

describe("governance-feedback-metrics.service", () => {
  it("counts labels correctly", () => {
    const results: GovernanceFeedbackResult[] = [
      row("GOOD_BLOCK", false, false, 10, 0),
      row("BAD_BLOCK", true, false, 0, 0),
      row("GOOD_APPROVAL", false, false, 5, 0),
      row("BAD_APPROVAL", false, true, 0, 20),
      row("GOOD_EXECUTION", false, false, 0, 0),
      row("BAD_EXECUTION", false, true, 0, 15),
      row("MISSED_RISK", false, true, 0, 30),
      row("INSUFFICIENT_DATA", false, false, 0, 0),
    ];
    const s = buildGovernancePerformanceSummary(results);
    expect(s.totalCases).toBe(8);
    expect(s.goodBlocks).toBe(1);
    expect(s.badBlocks).toBe(1);
    expect(s.goodApprovals).toBe(1);
    expect(s.badApprovals).toBe(1);
    expect(s.goodExecutions).toBe(1);
    expect(s.badExecutions).toBe(1);
    expect(s.missedRiskCases).toBe(1);
  });

  it("computes false positive / negative rates", () => {
    const results: GovernanceFeedbackResult[] = [
      row("BAD_BLOCK", true, false, 0, 0),
      row("BAD_APPROVAL", false, true, 0, 0),
      row("GOOD_EXECUTION", false, false, 0, 0),
      row("GOOD_EXECUTION", false, false, 0, 0),
    ];
    const s = buildGovernancePerformanceSummary(results);
    expect(s.falsePositiveRate).toBeCloseTo(0.25);
    expect(s.falseNegativeRate).toBeCloseTo(0.25);
  });

  it("sums protected and leaked revenue", () => {
    const results: GovernanceFeedbackResult[] = [
      row("GOOD_BLOCK", false, false, 100, 0),
      row("BAD_APPROVAL", false, true, 0, 50),
    ];
    const s = buildGovernancePerformanceSummary(results);
    expect(s.protectedRevenueEstimate).toBe(100);
    expect(s.leakedRevenueEstimate).toBe(50);
  });

  it("handles empty results", () => {
    const s = buildGovernancePerformanceSummary([]);
    expect(s.totalCases).toBe(0);
    expect(s.falsePositiveRate).toBe(0);
    expect(s.falseNegativeRate).toBe(0);
  });
});
