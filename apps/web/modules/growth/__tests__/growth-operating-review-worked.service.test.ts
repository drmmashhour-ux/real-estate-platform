import { describe, expect, it } from "vitest";
import { buildWorkedItems } from "../growth-operating-review-worked.service";
import type { GrowthOperatingReviewBuildInput } from "../growth-operating-review.types";

function baseInput(over: Partial<GrowthOperatingReviewBuildInput> = {}): GrowthOperatingReviewBuildInput {
  return {
    weekLabel: "2026-W01",
    createdAt: "2026-01-05T12:00:00.000Z",
    executive: null,
    dailyBrief: null,
    strategyBundle: null,
    governance: null,
    simulationBundle: null,
    memorySummary: null,
    agentCoordination: null,
    enforcementSnapshot: null,
    journalReflections: [],
    autopilot: { pending: 0, rejected: 0, approved: 0 },
    followUp: { dueNow: 0, highIntentQueued: 0 },
    learningControlFreezeRecommended: false,
    missingDataWarnings: [],
    ...over,
  };
}

describe("buildWorkedItems", () => {
  it("returns at most five items", () => {
    const items = buildWorkedItems(
      baseInput({
        executive: {
          status: "strong",
          topPriorities: [],
          topRisks: [],
          campaignSummary: { totalCampaigns: 2, adsPerformance: "STRONG" },
          leadSummary: { totalLeads: 5, hotLeads: 2, dueNow: 0 },
          createdAt: "2026-01-05T12:00:00.000Z",
        },
        strategyBundle: {
          createdAt: "2026-01-05T12:00:00.000Z",
          roadmapSummary: [],
          weeklyPlan: {
            horizon: "this_week",
            status: "strong",
            priorities: [],
            experiments: [],
            roadmap: [],
            blockers: [],
            notes: [],
            createdAt: "2026-01-05T12:00:00.000Z",
          },
        },
        governance: {
          status: "healthy",
          topRisks: [],
          blockedDomains: [],
          frozenDomains: [],
          humanReviewItems: [],
          humanReviewQueue: [],
          notes: [],
          createdAt: "2026-01-05T12:00:00.000Z",
        },
      }),
    );
    expect(items.length).toBeLessThanOrEqual(5);
    expect(items.every((i) => i.category === "worked")).toBe(true);
  });

  it("does not fabricate items when inputs are empty", () => {
    const items = buildWorkedItems(baseInput());
    expect(items.length).toBe(0);
  });
});
