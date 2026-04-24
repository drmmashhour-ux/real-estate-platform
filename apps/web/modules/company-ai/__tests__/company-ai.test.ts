import { describe, it, expect } from "vitest";
import { COMPANY_AI_BOUNDS, applyWeightDeltaCap, confidenceAfterSampleAdjust } from "../company-ai-bounds";
import { detectCompanyPatterns } from "../company-pattern-detection.engine";
import { routeCompanyAdaptation } from "../company-adaptation-routing.service";
import type { CompanyMetricsSnapshot } from "../company-outcome-aggregator.service";

function baseMetrics(over: Partial<CompanyMetricsSnapshot> = {}): CompanyMetricsSnapshot {
  return {
    window: { periodStart: "", periodEnd: "", periodType: "MONTHLY" },
    deals: { created: 40, closed: 4, cancelled: 2, closeRate: 0.1, sample: 40 },
    bookings: { created: 20, confirmedOrCompleted: 4, declinedOrCancelled: 2, conversionToConfirmed: 0.2, revenueCompletedCents: 0, sample: 20 },
    listings: { crmCreated: 0, fsboCreated: 0 },
    investors: { memoRows: 0, icPackRows: 0 },
    compliance: { openAlerts: 0 },
    notes: [],
    ...over,
  };
}

describe("company-ai bounds", () => {
  it("caps weight deltas", () => {
    const cap = COMPANY_AI_BOUNDS.maxWeightDelta;
    expect(applyWeightDeltaCap(1, 1 + cap + 0.2)).toBeCloseTo(1 + cap, 5);
    expect(applyWeightDeltaCap(1, 1 - cap - 0.2)).toBeCloseTo(1 - cap, 5);
  });

  it("suppresses confidence when sample is thin", () => {
    const high = confidenceAfterSampleAdjust(0.9, COMPANY_AI_BOUNDS.minSampleStrongPattern + 5);
    const low = confidenceAfterSampleAdjust(0.9, COMPANY_AI_BOUNDS.minSampleWeakPattern + 2);
    expect(high).toBeGreaterThan(low);
    expect(low).toBeLessThanOrEqual(0.85);
  });
});

describe("pattern detection", () => {
  it("does not emit strong patterns without minimum deal sample", () => {
    const m = baseMetrics({
      deals: { created: 3, closed: 0, cancelled: 0, closeRate: 0, sample: 3 },
    });
    const p = detectCompanyPatterns(m);
    expect(p.filter((x) => x.id === "deal_friction_high")).toHaveLength(0);
  });

  it("detects deal friction with sufficient sample", () => {
    const m = baseMetrics({
      deals: { created: 30, closed: 2, cancelled: 4, closeRate: 0.07, sample: 30 },
    });
    const p = detectCompanyPatterns(m);
    expect(p.some((x) => x.id === "deal_friction_high")).toBe(true);
  });
});

describe("adaptation routing", () => {
  it("requires human approval for risk tightening even at medium confidence", () => {
    const r = routeCompanyAdaptation({
      adaptationType: "RISK_TIGHTENING",
      domain: "DEALS",
      confidenceScore: 0.55,
    });
    expect(r.requiresHumanApproval).toBe(true);
    expect(r.targets).toContain("CEO_COMMAND_LAYER");
  });

  it("flags experiments for rollout path at low confidence", () => {
    const r = routeCompanyAdaptation({
      adaptationType: "EXPERIMENT_RECOMMENDATION",
      domain: "MARKETPLACE",
      confidenceScore: 0.45,
    });
    expect(r.requiresHumanApproval).toBe(false);
    expect(r.targets.some((t) => t.includes("BNHUB") || t.includes("PRICING"))).toBe(true);
  });
});
