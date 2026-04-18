import { describe, expect, it } from "vitest";
import {
  buildBlockedItems,
  buildDeferredItems,
  buildDidntWorkItems,
} from "../growth-operating-review-challenges.service";
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

describe("buildDidntWorkItems", () => {
  it("flags weak ads from executive snapshot", () => {
    const items = buildDidntWorkItems(
      baseInput({
        executive: {
          status: "watch",
          topPriorities: [],
          topRisks: [],
          campaignSummary: { totalCampaigns: 1, adsPerformance: "WEAK" },
          leadSummary: { totalLeads: 1, hotLeads: 0 },
          createdAt: "2026-01-05T12:00:00.000Z",
        },
      }),
    );
    expect(items.some((i) => i.category === "didnt_work")).toBe(true);
  });
});

describe("buildBlockedItems", () => {
  it("flags governance human review", () => {
    const items = buildBlockedItems(
      baseInput({
        governance: {
          status: "human_review_required",
          topRisks: [],
          blockedDomains: ["ads"],
          frozenDomains: [],
          humanReviewItems: [],
          humanReviewQueue: [],
          notes: [],
          createdAt: "2026-01-05T12:00:00.000Z",
        },
      }),
    );
    expect(items.some((i) => i.category === "blocked")).toBe(true);
  });
});

describe("buildDeferredItems", () => {
  it("flags simulation defer recommendations", () => {
    const items = buildDeferredItems(
      baseInput({
        simulationBundle: {
          createdAt: "2026-01-05T12:00:00.000Z",
          baselineSummary: {},
          scenarios: [
            {
              scenarioId: "s1",
              title: "Scale spend",
              estimates: [],
              risks: [],
              upsideSummary: "—",
              downsideSummary: "Risk",
              recommendation: "defer",
              confidence: "low",
              notes: ["wait"],
              createdAt: "2026-01-05T12:00:00.000Z",
            },
          ],
        },
      }),
    );
    expect(items.some((i) => i.title.includes("Simulation defer"))).toBe(true);
  });

  it("flags large daily priority surface", () => {
    const items = buildDeferredItems(
      baseInput({
        dailyBrief: {
          date: "2026-01-05",
          yesterday: { leads: 0, campaignsActive: 0 },
          today: { priorities: ["a", "b", "c", "d", "e"] },
          blockers: [],
          notes: [],
          status: "watch",
          createdAt: "2026-01-05T12:00:00.000Z",
        },
      }),
    );
    expect(items.some((i) => i.title.includes("priority"))).toBe(true);
  });
});
