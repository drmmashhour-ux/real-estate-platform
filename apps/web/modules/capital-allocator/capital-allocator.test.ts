import { describe, expect, it } from "vitest";

import { allocateBudgetAcrossCandidates } from "./capital-budget-engine.service";
import { buildAllocationCandidate } from "./capital-priority-score.service";
import type { ListingAllocationMetrics } from "./capital-allocator.types";
import { loadAllocationMetricsForScope } from "./capital-metrics-loader.service";

function baseMetrics(overrides: Partial<ListingAllocationMetrics> = {}): ListingAllocationMetrics {
  return {
    listingId: "lst-1",
    listingTitle: "Test Stay",
    grossRevenue: 5000,
    occupancyRate: 0.75,
    adr: 120,
    revpar: 85,
    bookingCount: 12,
    recommendation: null,
    recommendationScore: null,
    recommendationConfidence: null,
    upliftScore: 0.1,
    pricingActionSuccess: 0.06,
    operatingCostMonthly: null,
    improvementBudgetNeed: null,
    marketingBudgetNeed: null,
    operationalRiskScore: null,
    manualCapitalLock: false,
    ...overrides,
  };
}

describe("capital allocator (deterministic)", () => {
  it("computes reserve and allocatable budget", () => {
    const m = baseMetrics({ marketingBudgetNeed: 1000, occupancyRate: 0.7 });
    const c = buildAllocationCandidate(m);
    expect(c.recommendedAmount).toBeGreaterThan(0);

    const plan = allocateBudgetAcrossCandidates({
      totalBudget: 10000,
      reservePct: 0.1,
      candidates: [c],
    });
    expect(plan.reserveBudget).toBe(1000);
    expect(plan.allocatableBudget).toBe(9000);
    expect(plan.items[0]?.allocatedAmount).toBeLessThanOrEqual(plan.allocatableBudget);
  });

  it("assigns pause with zero recommended budget when signals are weak", () => {
    const c = buildAllocationCandidate(
      baseMetrics({
        occupancyRate: 0.35,
        upliftScore: -0.08,
        recommendation: "hold",
      }),
    );
    expect(c.allocationType).toBe("pause");
    expect(c.recommendedAmount).toBe(0);
    const plan = allocateBudgetAcrossCandidates({
      totalBudget: 8000,
      candidates: [c],
    });
    expect(plan.items[0]?.allocatedAmount).toBe(0);
  });

  it("assigns reduce with zero allocation for sell stance", () => {
    const c = buildAllocationCandidate(baseMetrics({ recommendation: "sell" }));
    expect(c.allocationType).toBe("reduce");
    const plan = allocateBudgetAcrossCandidates({
      totalBudget: 5000,
      candidates: [c],
    });
    expect(plan.items[0]?.allocatedAmount).toBe(0);
  });

  it("holds locked listings out of the dollar pool", () => {
    const c = buildAllocationCandidate(baseMetrics({ manualCapitalLock: true }));
    expect(c.allocationType).toBe("hold");
    expect(c.recommendedAmount).toBe(0);
    const plan = allocateBudgetAcrossCandidates({
      totalBudget: 5000,
      candidates: [c],
    });
    expect(plan.items[0]?.allocatedAmount).toBe(0);
  });

  it("splits budget across multiple listings by composite weight", () => {
    const a = buildAllocationCandidate(baseMetrics({ listingId: "a", marketingBudgetNeed: 800, occupancyRate: 0.72 }));
    const b = buildAllocationCandidate(
      baseMetrics({
        listingId: "b",
        listingTitle: "B",
        recommendation: "sell",
      }),
    );
    const plan = allocateBudgetAcrossCandidates({
      totalBudget: 10000,
      reservePct: 0,
      candidates: [a, b],
    });
    expect(plan.items.length).toBe(2);
    const allocatedA = plan.items.find((i) => i.listingId === "a")?.allocatedAmount ?? 0;
    expect(allocatedA).toBeGreaterThan(0);
    expect(plan.items.find((i) => i.listingId === "b")?.allocatedAmount).toBe(0);
  });

  it("rejects unsupported scope types for metric loading", async () => {
    await expect(loadAllocationMetricsForScope("unknown", "x")).rejects.toThrow(/Unsupported capital allocator scopeType/);
  });
});
