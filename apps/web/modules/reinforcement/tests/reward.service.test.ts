import { describe, expect, it } from "vitest";
import { computeStrategyReward } from "../reward.service";

describe("computeStrategyReward", () => {
  it("ranks WON > STALLED > LOST in [0,1]", () => {
    const w = computeStrategyReward({ outcome: "WON" });
    const s = computeStrategyReward({ outcome: "STALLED" });
    const l = computeStrategyReward({ outcome: "LOST" });
    expect(w).toBeGreaterThan(s);
    expect(s).toBeGreaterThan(l);
    expect(w).toBeLessThanOrEqual(1);
    expect(l).toBeGreaterThanOrEqual(0);
  });

  it("adds close-time bonus for wins only", () => {
    const fast = computeStrategyReward({ outcome: "WON", closingTimeDays: 20 });
    const slow = computeStrategyReward({ outcome: "WON", closingTimeDays: 120 });
    expect(fast).toBeGreaterThan(slow);
  });
});
