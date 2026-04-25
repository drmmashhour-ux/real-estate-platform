import { describe, expect, it } from "vitest";
import { evaluateLeadership } from "../market-leadership.engine";
import type { LeadershipMetrics } from "../leadership-metrics.types";

function m(p: Partial<LeadershipMetrics>): LeadershipMetrics {
  return {
    activeBrokers: 0,
    dealsProcessed: 0,
    engagementRate: 0,
    revenueCents: 0,
    asOfIso: new Date().toISOString(),
    scope: "test",
    ...p,
  };
}

describe("evaluateLeadership", () => {
  it("returns score 0–100 and gaps", () => {
    const r = evaluateLeadership(
      m({
        activeBrokers: 10,
        dealsProcessed: 5,
        engagementRate: 0.1,
        revenueCents: 100_00,
      })
    );
    expect(r.leadershipScore).toBeGreaterThanOrEqual(0);
    expect(r.leadershipScore).toBeLessThanOrEqual(100);
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.components).toBeDefined();
  });

  it("does not emit #1 or rank language in gap messages", () => {
    const r = evaluateLeadership(m({ activeBrokers: 1, dealsProcessed: 0, engagementRate: 0, revenueCents: 0 }));
    const blob = JSON.stringify(r);
    expect(blob.toLowerCase()).not.toContain("#1");
    expect(blob.toLowerCase()).not.toContain("number one");
  });
});
