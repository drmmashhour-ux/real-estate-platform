import { describe, expect, it } from "vitest";
import { buildNextWeekChangeItems } from "../growth-operating-review-next-week.service";
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

describe("buildNextWeekChangeItems", () => {
  it("caps suggestions at five", () => {
    const items = buildNextWeekChangeItems(
      baseInput({
        governance: {
          status: "freeze_recommended",
          topRisks: [],
          blockedDomains: [],
          frozenDomains: ["ads"],
          humanReviewItems: [],
          humanReviewQueue: [],
          notes: [],
          createdAt: "2026-01-05T12:00:00.000Z",
        },
        executive: {
          status: "watch",
          topPriorities: [],
          topRisks: ["a", "b", "c"],
          campaignSummary: { totalCampaigns: 1, adsPerformance: "WEAK" },
          leadSummary: { totalLeads: 1, hotLeads: 0 },
          createdAt: "2026-01-05T12:00:00.000Z",
        },
        followUp: { dueNow: 10, highIntentQueued: 10 },
        autopilot: { pending: 0, rejected: 5, approved: 0 },
        learningControlFreezeRecommended: true,
        strategyBundle: {
          createdAt: "2026-01-05T12:00:00.000Z",
          roadmapSummary: [],
          weeklyPlan: {
            horizon: "this_week",
            status: "weak",
            priorities: [],
            experiments: [],
            roadmap: [],
            blockers: [],
            notes: [],
            createdAt: "2026-01-05T12:00:00.000Z",
          },
        },
        enforcementSnapshot: {
          blockedTargets: ["autopilot_advisory_conversion", "fusion_autopilot_bridge"],
          frozenTargets: [],
          approvalRequiredTargets: [],
          rules: [],
          notes: [],
          createdAt: "2026-01-05T12:00:00.000Z",
        },
        simulationBundle: {
          createdAt: "2026-01-05T12:00:00.000Z",
          baselineSummary: {},
          scenarios: [
            {
              scenarioId: "d1",
              title: "D1",
              estimates: [],
              risks: [],
              upsideSummary: "",
              downsideSummary: "",
              recommendation: "defer",
              confidence: "low",
              notes: [],
              createdAt: "2026-01-05T12:00:00.000Z",
            },
            {
              scenarioId: "d2",
              title: "D2",
              estimates: [],
              risks: [],
              upsideSummary: "",
              downsideSummary: "",
              recommendation: "defer",
              confidence: "low",
              notes: [],
              createdAt: "2026-01-05T12:00:00.000Z",
            },
          ],
        },
        memorySummary: {
          recurringBlockers: [{ id: "m1", category: "blocker", title: "B", detail: "x", source: "governance", confidence: 0.5, createdAt: "2026-01-05T12:00:00.000Z" }],
          winningPatterns: [],
          campaignLessons: [],
          followupLessons: [],
          governanceLessons: [],
          operatorPreferences: [],
          notes: [],
          createdAt: "2026-01-05T12:00:00.000Z",
        },
      }),
    );
    expect(items.length).toBeLessThanOrEqual(5);
    expect(items.every((i) => i.category === "change_next_week")).toBe(true);
  });
});
