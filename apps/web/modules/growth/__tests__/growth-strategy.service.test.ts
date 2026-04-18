import { describe, expect, it } from "vitest";
import { composeGrowthStrategyBundleFromSnapshot } from "../growth-strategy-compose.service";
import type { GrowthStrategySourceSnapshot } from "../growth-strategy.types";
import type { GrowthExecutiveSummary } from "../growth-executive.types";
import { deriveGrowthStrategyStatus } from "../growth-strategy-status.util";

function snap(partial: Partial<GrowthStrategySourceSnapshot>): GrowthStrategySourceSnapshot {
  const executive: GrowthExecutiveSummary | null =
    partial.executive !== undefined
      ? partial.executive
      : ({
          status: "healthy",
          topPriorities: [
            { id: "a", title: "Stabilize acquisition", source: "ads", impact: "high", why: "weak band" },
          ],
          topRisks: [],
          campaignSummary: { totalCampaigns: 1, adsPerformance: "STRONG" },
          leadSummary: { totalLeads: 10, hotLeads: 2 },
          createdAt: "",
        } as GrowthExecutiveSummary);

  return {
    executive,
    dailyBrief: partial.dailyBrief ?? null,
    governance: partial.governance ?? null,
    fusionSummary: partial.fusionSummary ?? null,
    coordination: partial.coordination ?? null,
    autopilotTopActions: partial.autopilotTopActions ?? [],
    dueNowCount: partial.dueNowCount ?? 0,
    hotLeadCount: partial.hotLeadCount ?? 2,
    leadsTodayEarly: partial.leadsTodayEarly ?? 1,
    adsHealth: partial.adsHealth ?? "STRONG",
    missingDataWarnings: partial.missingDataWarnings ?? [],
  };
}

describe("composeGrowthStrategyBundleFromSnapshot", () => {
  it("builds with partial data", () => {
    const bundle = composeGrowthStrategyBundleFromSnapshot(
      {
        executive: null,
        dailyBrief: null,
        governance: null,
        fusionSummary: null,
        coordination: null,
        autopilotTopActions: [],
        dueNowCount: 0,
        hotLeadCount: 0,
        leadsTodayEarly: 0,
        adsHealth: "OK",
        missingDataWarnings: ["exec_missing"],
      },
      { experimentsEnabled: true, roadmapEnabled: true },
    );
    expect(bundle.weeklyPlan.priorities.length).toBeGreaterThanOrEqual(0);
    expect(bundle.weeklyPlan.status).toMatch(/weak|watch|healthy|strong/);
  });

  it("omits experiments when flag off", () => {
    const b = composeGrowthStrategyBundleFromSnapshot(snap({}), { experimentsEnabled: false, roadmapEnabled: true });
    expect(b.weeklyPlan.experiments.length).toBe(0);
  });

  it("omits roadmap when flag off", () => {
    const b = composeGrowthStrategyBundleFromSnapshot(snap({}), { experimentsEnabled: true, roadmapEnabled: false });
    expect(b.weeklyPlan.roadmap.length).toBe(0);
    expect(b.roadmapSummary.length).toBe(0);
  });
});

describe("deriveGrowthStrategyStatus", () => {
  it("returns watch when freeze recommended", () => {
    expect(
      deriveGrowthStrategyStatus({
        governanceRiskHigh: false,
        governanceHumanReview: false,
        governanceFreeze: true,
        blockerCount: 0,
        executiveWeak: false,
        executiveStrong: false,
        acquisitionWeak: false,
        fusionWeak: false,
        strongCampaignAndLeads: false,
        missingDataHeavy: false,
      }),
    ).toBe("watch");
  });
});
