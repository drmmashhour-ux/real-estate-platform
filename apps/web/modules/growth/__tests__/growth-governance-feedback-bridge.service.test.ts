import { describe, expect, it } from "vitest";
import { buildGrowthGovernanceFeedbackInsights } from "../growth-governance-feedback-bridge.service";
import type { GrowthGovernanceFeedbackSummary } from "../growth-governance-feedback.types";

function emptySummary(): GrowthGovernanceFeedbackSummary {
  return {
    repeatedUsefulConstraints: [],
    repeatedFreezePatterns: [],
    repeatedBlockedPatterns: [],
    possibleOverconservativeConstraints: [],
    notes: [],
    createdAt: "2026-04-01T00:00:00.000Z",
  };
}

describe("buildGrowthGovernanceFeedbackInsights", () => {
  it("returns at least one insight for empty summary (quiet window)", () => {
    const insights = buildGrowthGovernanceFeedbackInsights(emptySummary());
    expect(insights.length).toBeGreaterThan(0);
  });

  it("flags partial inputs note", () => {
    const s = emptySummary();
    s.notes = ["Partial inputs: governance_unavailable"];
    const insights = buildGrowthGovernanceFeedbackInsights(s);
    expect(insights.some((i) => i.title.includes("Incomplete"))).toBe(true);
  });
});
