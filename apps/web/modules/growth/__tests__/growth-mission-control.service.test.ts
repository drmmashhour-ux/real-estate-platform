import { describe, expect, it, vi, afterEach } from "vitest";
import { assembleGrowthMissionControlSummary } from "../growth-mission-control.service";
import type { GrowthMissionControlBuildContext } from "../growth-mission-control.types";
import { computeGrowthMissionControlStatus } from "../growth-mission-control-status.service";

const minimalCtx = (): GrowthMissionControlBuildContext => ({
  executive: {
    status: "weak",
    topPriorities: [],
    topRisks: [],
    campaignSummary: { totalCampaigns: 0, adsPerformance: "WEAK" },
    leadSummary: { totalLeads: 2, hotLeads: 0 },
    createdAt: new Date().toISOString(),
  },
  dailyBrief: {
    date: "x",
    yesterday: { leads: 0, campaignsActive: 0 },
    today: { priorities: [], focus: undefined },
    blockers: [],
    notes: [],
    status: "weak",
    createdAt: "x",
  },
  governance: null,
  fusion: null,
  strategyBundle: null,
  coordination: null,
  simulationBundle: null,
  learningControl: null,
  responseDesk: null,
  autopilotFocusTitle: null,
  missingDataWarnings: ["test_warning"],
});

describe("assembleGrowthMissionControlSummary", () => {
  it("does not mutate input context object fields", () => {
    const ctx = minimalCtx();
    const snap = JSON.stringify(ctx);
    assembleGrowthMissionControlSummary(ctx);
    expect(JSON.stringify(ctx)).toBe(snap);
  });

  it("returns summary with status aligned to risks helper", () => {
    const ctx = minimalCtx();
    const s = assembleGrowthMissionControlSummary(ctx);
    const risks = s.topRisks;
    const expected = computeGrowthMissionControlStatus({
      governance: null,
      executive: ctx.executive,
      dailyBrief: ctx.dailyBrief,
      mergedRisks: risks,
    });
    expect(s.status).toBe(expected);
  });

  it("keeps assembled notes bounded", () => {
    const ctx = minimalCtx();
    const s = assembleGrowthMissionControlSummary(ctx);
    expect(s.notes.length).toBeLessThanOrEqual(6);
    expect(s.todayChecklist.length).toBeLessThanOrEqual(5);
    expect(s.topRisks.length).toBeLessThanOrEqual(5);
    expect(s.humanReviewQueue.length).toBeLessThanOrEqual(5);
  });
});

describe("buildGrowthMissionControlSummary flag gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when mission control flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_MISSION_CONTROL_V1", "");
    vi.resetModules();
    const { buildGrowthMissionControlSummary } = await import("../growth-mission-control.service");
    await expect(buildGrowthMissionControlSummary()).resolves.toBeNull();
  });
});
