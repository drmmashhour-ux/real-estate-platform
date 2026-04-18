import { describe, expect, it } from "vitest";
import { buildGrowthStrategyRoadmap } from "../growth-strategy-roadmap.service";
import type { GrowthStrategySourceSnapshot } from "../growth-strategy.types";

function minimalSnapshot(over: Partial<GrowthStrategySourceSnapshot> = {}): GrowthStrategySourceSnapshot {
  return {
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
    missingDataWarnings: [],
    ...over,
  };
}

describe("buildGrowthStrategyRoadmap", () => {
  it("returns horizon-tagged items without throwing", () => {
    const items = buildGrowthStrategyRoadmap(minimalSnapshot({ adsHealth: "WEAK" }));
    expect(items.length).toBeGreaterThan(0);
    for (const r of items) {
      expect(["this_week", "next_2_weeks", "this_month"]).toContain(r.horizon);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.why.length).toBeGreaterThan(0);
    }
  });

  it("does not mutate input", () => {
    const snap = minimalSnapshot();
    const before = JSON.stringify(snap);
    buildGrowthStrategyRoadmap(snap);
    expect(JSON.stringify(snap)).toBe(before);
  });
});
