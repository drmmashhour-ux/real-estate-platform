import { describe, expect, it, vi, afterEach } from "vitest";
import { assembleGrowthDecisionJournalSummary } from "../growth-decision-journal.service";
import type { GrowthDecisionJournalBuildInput } from "../growth-decision-journal-build-input.types";

describe("assembleGrowthDecisionJournalSummary", () => {
  it("computes stats from entries and reflections", () => {
    const input: GrowthDecisionJournalBuildInput = {
      autopilot: null,
      executive: null,
      governance: null,
      strategyBundle: null,
      simulationBundle: null,
      missionControl: null,
      dailyBrief: null,
      coordination: null,
      missingDataWarnings: [],
    };
    const s = assembleGrowthDecisionJournalSummary(input, {
      adsPerformance: "OK",
      governanceStatus: null,
      executiveStatus: null,
      missionStatus: null,
      hotLeads: 0,
      dueNow: 0,
    });
    expect(s.stats.recommendedCount).toBe(0);
    expect(s.createdAt).toBeDefined();
  });
});

describe("buildGrowthDecisionJournalSummary flag gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when journal flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_DECISION_JOURNAL_V1", "");
    vi.resetModules();
    const { buildGrowthDecisionJournalSummary } = await import("../growth-decision-journal.service");
    await expect(buildGrowthDecisionJournalSummary()).resolves.toBeNull();
  });
});
