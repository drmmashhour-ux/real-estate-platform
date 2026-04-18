import { describe, expect, it } from "vitest";
import { extractGrowthMemoryEntries } from "../growth-memory-extractor.service";
import type { GrowthMemoryExtractorContext } from "../growth-memory.types";

const baseCtx = (): GrowthMemoryExtractorContext => ({
  executive: null,
  governance: null,
  strategyBundle: null,
  coordination: null,
  simulationBundle: null,
  responseDesk: null,
  adsHealth: "OK",
  leadsToday: 0,
  autopilotRejected: 0,
  autopilotPending: 0,
  autopilotManualOnly: 0,
  missingDataWarnings: [],
});

describe("extractGrowthMemoryEntries", () => {
  it("extracts blockers from executive due backlog", () => {
    const ctx = baseCtx();
    ctx.executive = {
      status: "weak",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
      leadSummary: { totalLeads: 20, hotLeads: 6, dueNow: 4 },
      createdAt: "x",
    };
    const e = extractGrowthMemoryEntries(ctx);
    expect(e.some((x) => x.category === "blocker")).toBe(true);
  });

  it("extracts mission_control digest when provided", () => {
    const ctx = baseCtx();
    ctx.missionControlDigest = {
      topRiskTitles: ["Scaling risk from MC"],
      humanReviewTitles: ["Review payout anomaly"],
    };
    const e = extractGrowthMemoryEntries(ctx);
    expect(e.some((x) => x.source === "mission_control")).toBe(true);
  });

  it("adds campaign lesson when ads band weak", () => {
    const ctx = baseCtx();
    ctx.executive = {
      status: "watch",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "WEAK" },
      leadSummary: { totalLeads: 5, hotLeads: 0 },
      createdAt: "x",
    };
    const e = extractGrowthMemoryEntries(ctx);
    expect(e.some((x) => x.category === "campaign_lesson")).toBe(true);
  });
});
