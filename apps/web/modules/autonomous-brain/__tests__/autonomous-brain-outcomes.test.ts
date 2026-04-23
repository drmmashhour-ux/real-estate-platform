import { describe, expect, it } from "vitest";

import { deltasFromSnapshots } from "../autonomous-brain-outcomes.service";

describe("autonomous-brain outcome tracking", () => {
  it("computes conversion delta between baseline and outcome snapshots", () => {
    const baseline = {
      seniorConversionRate30d: 0.1,
      avgLeadScore: 40,
      leadVolume30d: 100,
      demandIndex: 0.5,
      matchingEventsTotal: 10,
    };
    const outcome = {
      seniorConversionRate30d: 0.12,
      avgLeadScore: 42,
      leadVolume30d: 105,
      demandIndex: 0.52,
      matchingEventsTotal: 11,
    };

    const d = deltasFromSnapshots(baseline, outcome);
    expect(d.seniorConversionDelta).toBeCloseTo(0.02);
    expect(d.avgLeadScoreDelta).toBeCloseTo(2);
    expect(d.leadVolumeDelta).toBe(5);
  });

  it("returns null deltas when snapshots are incomplete", () => {
    const d = deltasFromSnapshots(null, { seniorConversionRate30d: 0.2 });
    expect(d.seniorConversionDelta).toBeNull();
  });
});
