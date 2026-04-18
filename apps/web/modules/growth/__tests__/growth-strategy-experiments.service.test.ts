import { describe, expect, it } from "vitest";
import { buildGrowthStrategyExperiments } from "../growth-strategy-experiments.service";
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

describe("buildGrowthStrategyExperiments", () => {
  it("returns between 3 and 5 suggestions", () => {
    const ex = buildGrowthStrategyExperiments(minimalSnapshot({ adsHealth: "WEAK" }));
    expect(ex.length).toBeGreaterThanOrEqual(3);
    expect(ex.length).toBeLessThanOrEqual(5);
    for (const e of ex) {
      expect(e.hypothesis.length).toBeGreaterThan(0);
      expect(e.successMetric.length).toBeGreaterThan(0);
      expect(e.why.length).toBeGreaterThan(0);
    }
  });

  it("includes hypothesis and metric for each experiment", () => {
    const ex = buildGrowthStrategyExperiments(
      minimalSnapshot({ hotLeadCount: 2, dueNowCount: 3, adsHealth: "WEAK" }),
    );
    expect(ex.every((x) => x.scope === "small" || x.scope === "medium")).toBe(true);
  });

  it("does not mutate input", () => {
    const snap = minimalSnapshot();
    const before = JSON.stringify(snap);
    buildGrowthStrategyExperiments(snap);
    expect(JSON.stringify(snap)).toBe(before);
  });
});
