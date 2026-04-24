import { describe, expect, it } from "vitest";
import { suggestAllocation, summarizeVentures, UNASSIGNED_VENTURE, ventureLabel } from "../allocation.engine";
import { ALLOCATION_CATEGORIES } from "../capital.types";
import type { CapitalProfile, TrackedInvestment } from "../capital.types";

const profile = (risk: CapitalProfile["riskProfile"]): CapitalProfile => ({
  currency: "USD",
  totalCapital: 10_000_000,
  liquidCapital: 3_000_000,
  allocatedCapital: 5_000_000,
  riskProfile: risk,
});

describe("suggestAllocation", () => {
  it("sums weights to ~1 for each risk band", () => {
    for (const r of ["conservative", "balanced", "aggressive"] as const) {
      const { targetWeights } = suggestAllocation(profile(r));
      const sum = ALLOCATION_CATEGORIES.reduce((s, k) => s + targetWeights[k], 0);
      expect(sum).toBeGreaterThan(0.999);
      expect(sum).toBeLessThan(1.001);
    }
  });
});

describe("summarizeVentures", () => {
  const rows: TrackedInvestment[] = [
    {
      id: "a",
      ventureName: "A",
      label: "x",
      category: "startups",
      amountCommitted: 1_000_000,
      illustrativeReturnPct: 0,
    },
    { id: "b", ventureName: "A", label: "y", category: "real_estate", amountCommitted: 2_000_000, illustrativeReturnPct: 4 },
    { id: "c", label: "z", category: "cash_reserve", amountCommitted: 500_000, illustrativeReturnPct: 0 },
  ];

  it("groups by ventureName and buckets unassigned", () => {
    expect(ventureLabel(rows[2])).toBe(UNASSIGNED_VENTURE);
    const roll = summarizeVentures(rows);
    expect(roll).toHaveLength(2);
    const a = roll.find((v) => v.ventureName === "A")!;
    expect(a.positionCount).toBe(2);
    expect(a.totalCommitted).toBe(3_000_000);
    expect(a.byCategory.startups).toBe(1_000_000);
    expect(a.byCategory.real_estate).toBe(2_000_000);
    expect(a.illustrativeReturnPct).toBeCloseTo((2_000_000 * 4) / 3_000_000, 5);
    const u = roll.find((v) => v.ventureName === UNASSIGNED_VENTURE)!;
    expect(u.positionCount).toBe(1);
    expect(u.totalCommitted).toBe(500_000);
  });

  it("sorts by total committed descending", () => {
    const roll = summarizeVentures(rows);
    expect(roll[0].totalCommitted).toBeGreaterThanOrEqual(roll[1].totalCommitted);
  });
});
