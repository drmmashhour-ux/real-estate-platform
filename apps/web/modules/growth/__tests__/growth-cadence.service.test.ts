import { describe, expect, it } from "vitest";
import { composeGrowthCadenceBundle } from "../growth-cadence-compose.service";
import type { GrowthDailyCadenceInput } from "../growth-cadence-daily.service";
import type { GrowthWeeklyCadenceInput } from "../growth-cadence-weekly.service";

describe("composeGrowthCadenceBundle", () => {
  it("returns daily + weekly + createdAt", () => {
    const dailyInput: GrowthDailyCadenceInput = {
      dailyBrief: null,
      executive: {
        status: "healthy",
        topPriorities: [],
        topRisks: [],
        campaignSummary: { totalCampaigns: 0, adsPerformance: "OK" },
        leadSummary: { totalLeads: 0, hotLeads: 0 },
        createdAt: "",
      },
      coordination: null,
      governance: null,
      learningControl: null,
      responseDesk: null,
      missingDataWarnings: [],
    };
    const weeklyInput: GrowthWeeklyCadenceInput = {
      strategyBundle: null,
      executive: dailyInput.executive,
      learningSummary: null,
      governance: null,
      learningControl: null,
    };
    const b = composeGrowthCadenceBundle(dailyInput, weeklyInput);
    expect(b.daily).toBeTruthy();
    expect(b.weekly).toBeTruthy();
    expect(b.createdAt).toBeTruthy();
  });
});
