import { describe, expect, it } from "vitest";
import { buildGrowthStrategyPriorities } from "../growth-strategy-priority.service";
import type { GrowthStrategySourceSnapshot } from "../growth-strategy.types";
import type { GrowthExecutiveSummary } from "../growth-executive.types";

function baseSnapshot(over: Partial<GrowthStrategySourceSnapshot> = {}): GrowthStrategySourceSnapshot {
  const executive: GrowthExecutiveSummary = {
    status: "healthy",
    topPriorities: [
      {
        id: "ep-1",
        title: "Review campaign performance",
        source: "ads",
        impact: "high",
        confidence: 0.8,
        why: "Executive rollup",
      },
    ],
    topRisks: [],
    campaignSummary: { totalCampaigns: 2, adsPerformance: "OK" },
    leadSummary: { totalLeads: 5, hotLeads: 1, dueNow: 1 },
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over.executive,
  };
  return {
    executive: over.executive === null ? null : { ...executive, ...over.executive },
    dailyBrief: over.dailyBrief ?? null,
    governance: over.governance ?? null,
    fusionSummary: over.fusionSummary ?? null,
    coordination: over.coordination ?? null,
    autopilotTopActions: over.autopilotTopActions ?? [],
    dueNowCount: over.dueNowCount ?? 1,
    hotLeadCount: over.hotLeadCount ?? 1,
    leadsTodayEarly: over.leadsTodayEarly ?? 0,
    adsHealth: over.adsHealth ?? "OK",
    missingDataWarnings: over.missingDataWarnings ?? [],
  };
}

describe("buildGrowthStrategyPriorities", () => {
  it("returns at most 5 priorities", () => {
    const snap = baseSnapshot({
      executive: {
        status: "healthy",
        topPriorities: Array.from({ length: 8 }, (_, i) => ({
          id: `p-${i}`,
          title: `Priority ${i}`,
          source: "fusion" as const,
          impact: "medium" as const,
          why: "test",
        })),
        topRisks: [],
        campaignSummary: { totalCampaigns: 1, adsPerformance: "OK" },
        leadSummary: { totalLeads: 1, hotLeads: 0 },
        createdAt: "",
      },
    });
    const prios = buildGrowthStrategyPriorities(snap);
    expect(prios.length).toBeLessThanOrEqual(5);
  });

  it("works with partial / null executive", () => {
    const snap = baseSnapshot({ executive: null });
    const prios = buildGrowthStrategyPriorities(snap);
    expect(Array.isArray(prios)).toBe(true);
  });

  it("does not mutate snapshot", () => {
    const snap = baseSnapshot();
    const clone = JSON.stringify(snap);
    buildGrowthStrategyPriorities(snap);
    expect(JSON.stringify(snap)).toBe(clone);
  });
});
