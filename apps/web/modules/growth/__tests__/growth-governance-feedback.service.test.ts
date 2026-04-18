import { describe, expect, it } from "vitest";
import { buildGrowthGovernanceFeedbackSummary } from "../growth-governance-feedback.service";
import { extractGrowthGovernanceFeedbackEntries } from "../growth-governance-feedback-extractor.service";
import type { GrowthGovernanceFeedbackEntry } from "../growth-governance-feedback.types";

describe("buildGrowthGovernanceFeedbackSummary", () => {
  it("deduplicates and buckets entries deterministically", () => {
    const raw: GrowthGovernanceFeedbackEntry[] = [
      {
        id: "a",
        category: "freeze",
        target: "learning",
        title: "Test freeze",
        rationale: "r1",
        recurrenceCount: 1,
        usefulnessSignal: "useful",
        source: "governance",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "b",
        category: "freeze",
        target: "learning",
        title: "Test freeze",
        rationale: "r2",
        recurrenceCount: 1,
        usefulnessSignal: "useful",
        source: "governance",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ];
    const s = buildGrowthGovernanceFeedbackSummary(raw);
    expect(s.repeatedFreezePatterns.length).toBe(1);
    expect(s.repeatedFreezePatterns[0].recurrenceCount).toBeGreaterThan(1);
  });

  it("integrates with extractor on synthetic governance + enforcement", () => {
    const entries = extractGrowthGovernanceFeedbackEntries({
      governance: {
        status: "healthy",
        topRisks: [],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: "2026-04-01T00:00:00.000Z",
      },
      policySnapshot: null,
      enforcementSnapshot: {
        rules: [
          {
            id: "r1",
            target: "strategy_recommendation_promotion",
            mode: "advisory_only",
            rationale: "gated",
            source: "governance",
            createdAt: "2026-04-01T00:00:00.000Z",
          },
          {
            id: "r2",
            target: "simulation_recommendation_promotion",
            mode: "advisory_only",
            rationale: "gated",
            source: "governance",
            createdAt: "2026-04-01T00:00:00.000Z",
          },
        ],
        blockedTargets: [],
        frozenTargets: [],
        approvalRequiredTargets: [],
        notes: [],
        createdAt: "2026-04-01T00:00:00.000Z",
      },
      learningControl: null,
      missionHumanReviewQueueLength: 0,
      observedAt: "2026-04-01T00:00:00.000Z",
    });
    const summary = buildGrowthGovernanceFeedbackSummary(entries);
    expect(summary.possibleOverconservativeConstraints.length).toBeGreaterThan(0);
  });
});
