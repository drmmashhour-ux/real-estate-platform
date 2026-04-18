import { describe, expect, it } from "vitest";
import { resolveGrowthMissionFocus } from "../growth-mission-control-focus.service";
import type { GrowthMissionControlBuildContext } from "../growth-mission-control.types";

const emptyCtx = (): GrowthMissionControlBuildContext => ({
  executive: null,
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
});

describe("resolveGrowthMissionFocus", () => {
  it("prioritizes governance human_review_required", () => {
    const ctx = emptyCtx();
    ctx.governance = {
      status: "human_review_required",
      topRisks: [],
      blockedDomains: [],
      frozenDomains: [],
      humanReviewItems: [],
      humanReviewQueue: [],
      notes: [],
      createdAt: new Date().toISOString(),
    };
    const f = resolveGrowthMissionFocus(ctx);
    expect(f.source).toBe("governance");
    expect(f.title.toLowerCase()).toContain("governance");
  });

  it("uses executive topPriority when governance clear", () => {
    const ctx = emptyCtx();
    ctx.executive = {
      status: "healthy",
      topPriority: "Ship follow-up templates",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
      leadSummary: { totalLeads: 10, hotLeads: 1 },
      createdAt: new Date().toISOString(),
    };
    const f = resolveGrowthMissionFocus(ctx);
    expect(f.source).toBe("executive");
    expect(f.title).toBe("Ship follow-up templates");
  });

  it("prioritizes fusion over executive when fusion has a top action", () => {
    const ctx = emptyCtx();
    ctx.fusion = {
      summary: {
        status: "moderate",
        topProblems: [],
        topOpportunities: [],
        topActions: ["Unified next step"],
        confidence: 0.6,
        signals: [],
        grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
        createdAt: new Date().toISOString(),
      },
      actions: [
        {
          id: "fa1",
          title: "Follow up high-intent leads first",
          description: "d",
          source: "leads",
          impact: "high",
          confidence: 0.8,
          priorityScore: 90,
          why: "Fusion ranked this highest.",
          executionMode: "manual_only",
        },
      ],
    };
    ctx.executive = {
      status: "healthy",
      topPriority: "Executive-only priority",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
      leadSummary: { totalLeads: 10, hotLeads: 1 },
      createdAt: new Date().toISOString(),
    };
    const f = resolveGrowthMissionFocus(ctx);
    expect(f.source).toBe("fusion");
    expect(f.title).toBe("Follow up high-intent leads first");
  });

  it("prefers executive when fusion title duplicates executive top priority", () => {
    const ctx = emptyCtx();
    ctx.fusion = {
      summary: {
        status: "moderate",
        topProblems: [],
        topOpportunities: [],
        topActions: [],
        confidence: 0.6,
        signals: [],
        grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
        createdAt: new Date().toISOString(),
      },
      actions: [
        {
          id: "fa1",
          title: "Ship weekly nurture sequence",
          description: "d",
          source: "leads",
          impact: "high",
          confidence: 0.8,
          priorityScore: 90,
          why: "Fusion ranked this highest.",
          executionMode: "manual_only",
        },
      ],
    };
    ctx.executive = {
      status: "healthy",
      topPriority: "Ship weekly nurture sequence",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
      leadSummary: { totalLeads: 10, hotLeads: 1 },
      createdAt: new Date().toISOString(),
    };
    const f = resolveGrowthMissionFocus(ctx);
    expect(f.source).toBe("executive");
    expect(f.title).toBe("Ship weekly nurture sequence");
  });

  it("uses daily brief focus after executive", () => {
    const ctx = emptyCtx();
    ctx.executive = {
      status: "healthy",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
      leadSummary: { totalLeads: 10, hotLeads: 1 },
      createdAt: new Date().toISOString(),
    };
    ctx.dailyBrief = {
      date: "2026-01-01",
      yesterday: { leads: 1, campaignsActive: 1 },
      today: { priorities: [], focus: "Clear due follow-ups" },
      blockers: [],
      notes: [],
      status: "healthy",
      createdAt: new Date().toISOString(),
    };
    const f = resolveGrowthMissionFocus(ctx);
    expect(f.source).toBe("daily_brief");
    expect(f.title).toBe("Clear due follow-ups");
  });
});
