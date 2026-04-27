import { describe, expect, it } from "vitest";
import { buildDailyAdjustment, order61AdjustmentClamp } from "../dailyPricingRules";
import { getSeasonTypeForDate } from "@/lib/market/seasonRules";

describe("Order 61 — buildDailyAdjustment", () => {
  it("adds weekend +8%", () => {
    // Saturday in May (normal season — not high June–Aug/Dec)
    const d = new Date(2026, 4, 2);
    const s = getSeasonTypeForDate(d);
    const b = buildDailyAdjustment(d, s, 0, 0.5);
    expect(b.clamped).toBeCloseTo(0.08, 4);
    expect(b.reasons.some((r) => r === "Weekend")).toBe(true);
  });

  it("applies high season +12%", () => {
    const d = new Date(2026, 5, 10); // June = high
    const s = getSeasonTypeForDate(d);
    const b = buildDailyAdjustment(d, s, 0, 0.5);
    expect(b.reasons).toContain("High season");
    expect(b.clamped).toBeGreaterThan(0.1);
  });

  it("applies high demand +10% (score >= 100)", () => {
    const d = new Date(2026, 4, 12);
    const s = getSeasonTypeForDate(d);
    const b = buildDailyAdjustment(d, s, 100, 0.5);
    expect(b.reasons).toContain("High demand");
  });

  it("clamps to +30%", () => {
    const d = new Date(2026, 5, 6); // Sat + many uplifts
    const s = "high_season" as const;
    const b = buildDailyAdjustment(d, s, 100, 0.85);
    expect(b.clamped).toBe(order61AdjustmentClamp.max);
  });

  it("clamps to -10%", () => {
    const d = new Date(2026, 1, 10); // Tue Feb — low in Jan/Feb
    const s = "low_season" as const;
    const b = buildDailyAdjustment(d, s, 0, 0.1);
    expect(b.clamped).toBeGreaterThanOrEqual(order61AdjustmentClamp.min);
  });
});
