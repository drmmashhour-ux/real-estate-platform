import { describe, expect, it } from "vitest";
import {
  assembleGrowthOperatingReviewSummary,
  deriveGrowthOperatingReviewStatus,
  formatIsoWeekLabel,
} from "../growth-operating-review.service";
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

describe("formatIsoWeekLabel", () => {
  it("is deterministic for a fixed date", () => {
    const d = new Date("2026-04-02T12:00:00.000Z");
    expect(formatIsoWeekLabel(d)).toBe(formatIsoWeekLabel(d));
  });
});

describe("deriveGrowthOperatingReviewStatus", () => {
  it("returns weak when negatives dominate and few wins", () => {
    expect(
      deriveGrowthOperatingReviewStatus({
        worked: 0,
        didntWork: 3,
        blocked: 2,
        deferred: 0,
        nextWeekChangeCount: 2,
      }),
    ).toBe("weak");
  });

  it("returns strong when repeated wins and low friction", () => {
    expect(
      deriveGrowthOperatingReviewStatus({
        worked: 3,
        didntWork: 0,
        blocked: 0,
        deferred: 1,
        nextWeekChangeCount: 2,
      }),
    ).toBe("strong");
  });

  it("returns watch when many deferred items", () => {
    expect(
      deriveGrowthOperatingReviewStatus({
        worked: 1,
        didntWork: 0,
        blocked: 0,
        deferred: 5,
        nextWeekChangeCount: 1,
      }),
    ).toBe("watch");
  });
});

describe("assembleGrowthOperatingReviewSummary", () => {
  it("builds safely from sparse inputs without mutating the input object", () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    const s = assembleGrowthOperatingReviewSummary(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(s.weekLabel).toBe("2026-W01");
    expect(s.worked.length).toBeLessThanOrEqual(5);
    expect(s.didntWork.length).toBeLessThanOrEqual(5);
    expect(s.blocked.length).toBeLessThanOrEqual(5);
    expect(s.deferred.length).toBeLessThanOrEqual(5);
    expect(s.nextWeekChanges.length).toBeLessThanOrEqual(5);
    expect(s.notes.length).toBeGreaterThan(0);
  });

  it("classifies executive weak ads conservatively", () => {
    const input = baseInput({
      executive: {
        status: "watch",
        topPriorities: [],
        topRisks: ["r1", "r2"],
        campaignSummary: {
          totalCampaigns: 2,
          adsPerformance: "WEAK",
        },
        leadSummary: { totalLeads: 10, hotLeads: 0 },
        createdAt: "2026-01-05T12:00:00.000Z",
      },
    });
    const s = assembleGrowthOperatingReviewSummary(input);
    expect(s.didntWork.some((x) => x.title.includes("weak") || x.title.includes("Campaign"))).toBe(true);
  });
});
