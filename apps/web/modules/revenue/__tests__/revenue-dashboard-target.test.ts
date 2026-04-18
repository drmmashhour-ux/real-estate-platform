import { describe, expect, it, vi, beforeEach } from "vitest";

describe("revenue-dashboard-target", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT;
  });

  it("computeDailyTargetProgress uses default target 750 when env unset", async () => {
    const { computeDailyTargetProgress, getEffectiveDailyRevenueTargetCad } = await import(
      "../revenue-dashboard-target"
    );
    expect(getEffectiveDailyRevenueTargetCad()).toBe(750);
    const p = computeDailyTargetProgress(375);
    expect(p.targetCad).toBe(750);
    expect(p.todayCad).toBe(375);
    expect(p.pctToGoal).toBeCloseTo(0.5, 5);
  });

  it("respects REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT", async () => {
    process.env.REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT = "2000";
    const { computeDailyTargetProgress, getEffectiveDailyRevenueTargetCad } = await import(
      "../revenue-dashboard-target"
    );
    expect(getEffectiveDailyRevenueTargetCad()).toBe(2000);
    expect(computeDailyTargetProgress(500).pctToGoal).toBeCloseTo(0.25, 5);
  });
});
