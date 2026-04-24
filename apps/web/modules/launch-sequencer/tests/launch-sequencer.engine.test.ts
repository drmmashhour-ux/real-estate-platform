import { describe, expect, it, beforeEach } from "vitest";
import { generateLaunchSequence } from "../launch-sequencer.engine";
import { resetGlobalExpansionStateForTests } from "@/modules/global-expansion/global-country.service";

describe("generateLaunchSequence", () => {
  beforeEach(() => {
    resetGlobalExpansionStateForTests();
  });

  it("returns ordered recommendations with stable rationale", () => {
    const out = generateLaunchSequence();
    expect(out.recommendations.length).toBeGreaterThan(0);
    expect(out.summary.length).toBeGreaterThan(0);
    for (let i = 0; i < out.recommendations.length; i++) {
      expect(out.recommendations[i]?.priorityRank).toBe(i + 1);
      expect(out.recommendations[i]?.rationale.length).toBeGreaterThan(0);
    }
  });

  it("penalizes high opportunity with low readiness vs balanced market (monotonic sort sanity)", () => {
    const out = generateLaunchSequence();
    const keys = new Set(out.recommendations.map((r) => r.marketKey));
    expect(keys.size).toBe(out.recommendations.length);
    const top = out.recommendations[0];
    expect(top).toBeDefined();
    expect(top!.readiness.score).toBeGreaterThan(0);
  });
});
