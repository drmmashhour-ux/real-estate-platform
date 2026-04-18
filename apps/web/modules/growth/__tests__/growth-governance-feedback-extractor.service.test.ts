import { describe, expect, it } from "vitest";
import { extractGrowthGovernanceFeedbackEntries } from "../growth-governance-feedback-extractor.service";

describe("extractGrowthGovernanceFeedbackEntries", () => {
  it("returns empty-safe output from all-null inputs", () => {
    const entries = extractGrowthGovernanceFeedbackEntries({
      governance: null,
      policySnapshot: null,
      enforcementSnapshot: null,
      learningControl: null,
      missionHumanReviewQueueLength: 0,
      observedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("extracts freeze entries from learning control without mutating input objects", () => {
    const lc = {
      state: "freeze_recommended" as const,
      reasons: [],
      confidence: 0.8,
      recommendedActions: [],
      observedSignals: {},
      createdAt: "2026-04-01T00:00:00.000Z",
    };
    const before = JSON.stringify(lc);
    const entries = extractGrowthGovernanceFeedbackEntries({
      governance: null,
      policySnapshot: null,
      enforcementSnapshot: null,
      learningControl: lc,
      missionHumanReviewQueueLength: 0,
      observedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(JSON.stringify(lc)).toBe(before);
    expect(entries.some((e) => e.target === "learning_adjustments")).toBe(true);
  });
});
