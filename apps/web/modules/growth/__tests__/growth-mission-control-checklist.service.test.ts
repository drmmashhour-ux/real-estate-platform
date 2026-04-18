import { describe, expect, it } from "vitest";
import { buildGrowthMissionChecklist } from "../growth-mission-control-checklist.service";
import type { GrowthMissionControlBuildContext } from "../growth-mission-control.types";

describe("buildGrowthMissionChecklist", () => {
  it("caps at 5 items", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: {
        date: "x",
        yesterday: { leads: 0, campaignsActive: 0 },
        today: {
          priorities: ["a", "b", "c", "d", "e", "f"],
          focus: "focus",
        },
        blockers: [],
        notes: [],
        status: "healthy",
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
      missingDataWarnings: [],
    };
    const { items: list } = buildGrowthMissionChecklist(ctx);
    expect(list.length).toBeLessThanOrEqual(5);
  });

  it("deduplicates similar lines", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: {
        status: "healthy",
        topPriorities: [{ id: "1", title: "Same", source: "leads", impact: "high", why: "x" }],
        topRisks: [],
        campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
        leadSummary: { totalLeads: 5, hotLeads: 0 },
        createdAt: "x",
      },
      dailyBrief: {
        date: "x",
        yesterday: { leads: 0, campaignsActive: 0 },
        today: { priorities: ["Same"], focus: undefined },
        blockers: [],
        notes: [],
        status: "healthy",
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
      missingDataWarnings: [],
    };
    const { items: list } = buildGrowthMissionChecklist(ctx);
    expect(list.filter((l) => l.includes("Same")).length).toBe(1);
  });

  it("includes a fusion line when fusion data is present", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: null,
      governance: null,
      fusion: {
        summary: {
          status: "moderate",
          topProblems: [],
          topOpportunities: [],
          topActions: ["Backup action text"],
          confidence: 0.5,
          signals: [],
          grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
          createdAt: "x",
        },
        actions: [
          {
            id: "x",
            title: "Check top fusion action before scaling",
            description: "",
            source: "leads",
            impact: "medium",
            confidence: 0.7,
            priorityScore: 80,
            why: "w",
            executionMode: "approval_required",
          },
        ],
      },
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    const { items: list } = buildGrowthMissionChecklist(ctx);
    expect(list.some((l) => l.includes("Check top fusion action before scaling"))).toBe(true);
  });
});
