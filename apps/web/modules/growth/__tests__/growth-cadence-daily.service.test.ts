import { describe, expect, it } from "vitest";
import { buildGrowthDailyCadence, type GrowthDailyCadenceInput } from "../growth-cadence-daily.service";

describe("buildGrowthDailyCadence", () => {
  it("caps checklist at 5 items", () => {
    const input: GrowthDailyCadenceInput = {
      dailyBrief: {
        date: "2026-04-02",
        yesterday: { leads: 0, campaignsActive: 0 },
        today: {
          priorities: ["A", "B", "C", "D", "E", "F"],
        },
        blockers: [],
        notes: [],
        status: "healthy",
        createdAt: "",
      },
      executive: {
        status: "healthy",
        topPriorities: [
          { id: "1", title: "P1", source: "fusion", impact: "high", why: "x" },
          { id: "2", title: "P2", source: "ads", impact: "high", why: "x" },
        ],
        topRisks: [],
        campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
        leadSummary: { totalLeads: 1, hotLeads: 0 },
        createdAt: "",
      },
      coordination: null,
      governance: null,
      learningControl: null,
      responseDesk: null,
      missingDataWarnings: [],
    };
    const d = buildGrowthDailyCadence(input);
    expect(d.checklist.length).toBeLessThanOrEqual(5);
  });

  it("handles null-heavy input safely", () => {
    const input: GrowthDailyCadenceInput = {
      dailyBrief: null,
      executive: null,
      coordination: null,
      governance: null,
      learningControl: null,
      responseDesk: null,
      missingDataWarnings: ["x"],
    };
    const d = buildGrowthDailyCadence(input);
    expect(d.status).toMatch(/weak|watch|healthy|strong/);
    expect(d.checklist.length).toBeGreaterThanOrEqual(1);
  });

  it("does not mutate input", () => {
    const input: GrowthDailyCadenceInput = {
      dailyBrief: null,
      executive: null,
      coordination: null,
      governance: null,
      learningControl: null,
      responseDesk: null,
      missingDataWarnings: [],
    };
    const copy = JSON.stringify(input);
    buildGrowthDailyCadence(input);
    expect(JSON.stringify(input)).toBe(copy);
  });
});
