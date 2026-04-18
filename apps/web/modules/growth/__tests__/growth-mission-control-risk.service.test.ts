import { describe, expect, it } from "vitest";
import { buildGrowthMissionRisks } from "../growth-mission-control-risk.service";
import type { GrowthMissionControlBuildContext } from "../growth-mission-control.types";

describe("buildGrowthMissionRisks", () => {
  it("dedupes by title and keeps higher severity", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: null,
      governance: {
        status: "healthy",
        topRisks: [
          {
            id: "1",
            category: "ads",
            severity: "low",
            title: "Weak funnel",
            description: "d",
            reason: "r",
          },
          {
            id: "2",
            category: "ads",
            severity: "high",
            title: "weak funnel",
            description: "d",
            reason: "r2",
          },
        ],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: "x",
      },
      fusion: null,
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    const { risks } = buildGrowthMissionRisks(ctx);
    const weak = risks.filter((r) => r.title.toLowerCase().includes("weak funnel"));
    expect(weak.length).toBe(1);
    expect(weak[0]?.severity).toBe("high");
  });

  it("limits to 5 risks", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: {
        status: "healthy",
        topPriorities: [],
        topRisks: ["a", "b", "c", "d", "e", "f"],
        campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
        leadSummary: { totalLeads: 1, hotLeads: 0 },
        createdAt: "x",
      },
      dailyBrief: null,
      governance: null,
      fusion: null,
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    expect(buildGrowthMissionRisks(ctx).risks.length).toBeLessThanOrEqual(5);
  });

  it("adds fusion weak status and top problems", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: null,
      governance: null,
      fusion: {
        summary: {
          status: "weak",
          topProblems: ["Fragmented funnel signals"],
          topOpportunities: [],
          topActions: [],
          confidence: 0.4,
          signals: [],
          grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
          createdAt: "x",
        },
        actions: [],
      },
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    const { risks } = buildGrowthMissionRisks(ctx);
    expect(risks.some((r) => r.source === "fusion" && r.title.toLowerCase().includes("weak"))).toBe(true);
    expect(risks.some((r) => r.title.includes("Fragmented"))).toBe(true);
  });
});
