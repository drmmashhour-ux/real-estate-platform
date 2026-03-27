import { describe, expect, it } from "vitest";
import { buildExecutionAlerts, shouldAlertRateDrop } from "@/src/modules/growth-funnel/application/computeExecutionAlerts";

describe("shouldAlertRateDrop", () => {
  it("returns false when data is missing", () => {
    expect(shouldAlertRateDrop(null, 50)).toBe(false);
    expect(shouldAlertRateDrop(40, null)).toBe(false);
  });

  it("returns false when previous rate is too low to compare", () => {
    expect(shouldAlertRateDrop(1, 2)).toBe(false);
  });

  it("fires on large relative drop", () => {
    expect(shouldAlertRateDrop(30, 50)).toBe(true);
  });

  it("fires on moderate absolute drop when relative is small", () => {
    expect(shouldAlertRateDrop(47, 50, { relativePct: 50, absolutePoints: 2.5 })).toBe(true);
  });

  it("returns false when rate improves", () => {
    expect(shouldAlertRateDrop(55, 50)).toBe(false);
  });
});

describe("buildExecutionAlerts", () => {
  it("returns alerts for drops across metrics", () => {
    const alerts = buildExecutionAlerts(
      { activationRate: 20, retentionRate: 10, conversionRate: 5 },
      { activationRate: 40, retentionRate: 30, conversionRate: 25 }
    );
    expect(alerts.length).toBe(3);
    expect(alerts.map((a) => a.metric).sort()).toEqual(["activation", "conversion", "retention"]);
  });

  it("returns empty when stable", () => {
    const alerts = buildExecutionAlerts(
      { activationRate: 40, retentionRate: 30, conversionRate: 25 },
      { activationRate: 40, retentionRate: 30, conversionRate: 25 }
    );
    expect(alerts.length).toBe(0);
  });
});
