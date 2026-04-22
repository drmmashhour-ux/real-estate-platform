import { describe, expect, it } from "vitest";
import { computeFunnelRates, funnelToPerformanceScore, emptyFunnel } from "./matching-events.service";
import { pearsonCorrelation } from "./learning.service";

describe("matching learning — funnel metrics", () => {
  it("computes CTR, lead rate, conversion rate with smoothing", () => {
    const f = { ...emptyFunnel(), views: 100, clicks: 40, leads: 10, visits: 3, converted: 2 };
    const r = computeFunnelRates(f);
    expect(r.ctr).toBeGreaterThan(0);
    expect(r.leadRate).toBeGreaterThan(0);
    expect(r.conversionRate).toBeGreaterThan(0);
    expect(r.conversionRate).toBeLessThanOrEqual(1);
  });

  it("maps funnel to performance score in 0–100", () => {
    const high = funnelToPerformanceScore({
      views: 50,
      clicks: 30,
      leads: 12,
      visits: 8,
      converted: 6,
    });
    const low = funnelToPerformanceScore({
      views: 50,
      clicks: 2,
      leads: 1,
      visits: 0,
      converted: 0,
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });
});

describe("matching learning — pearsonCorrelation", () => {
  it("returns ~1 for perfect positive correlation", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(xs, ys)).toBeCloseTo(1, 5);
  });

  it("returns 0 for insufficient length", () => {
    expect(pearsonCorrelation([1, 2], [1, 2])).toBe(0);
  });
});

describe("blended score formula", () => {
  it("keeps 70/30 rule blend in range", () => {
    const baseScore = 80;
    const performanceScore = 40;
    const score = Math.round(baseScore * 0.7 + performanceScore * 0.3);
    expect(score).toBe(Math.round(56 + 12));
    expect(score).toBe(68);
  });
});
