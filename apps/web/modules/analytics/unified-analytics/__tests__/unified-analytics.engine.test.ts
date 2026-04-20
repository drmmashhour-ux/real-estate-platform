import { describe, expect, it } from "vitest";
import { buildForecastFromSeries } from "../forecast.service";
import { buildDeterministicInsights } from "../analytics-insights.service";

describe("buildForecastFromSeries", () => {
  it("projects 30d revenue from trailing daily average", () => {
    const revenueDaily = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      value: 1000,
    }));
    const leadDaily = revenueDaily.map((p) => ({ ...p, value: 5 }));
    const f = buildForecastFromSeries({ revenueDaily, leadDaily });
    expect(f.revenueNext30DaysCents).toBe(30_000);
    expect(f.growthTrendPct).toBeDefined();
  });
});

describe("buildDeterministicInsights", () => {
  it("surfaces conversion uplift when delta is strong", () => {
    const ins = buildDeterministicInsights({
      conversionRate: 0.12,
      conversionPrev: 0.08,
      leadsTotal: 100,
      leadsPrev: 90,
      revenueCents: 50_000,
      revenuePrevCents: 40_000,
      topCityLabel: "Montreal",
      demandSpikeRisk: "low",
      growthTrendPct: 4,
    });
    expect(ins.some((x) => x.text.toLowerCase().includes("conversion"))).toBe(true);
    expect(ins.some((x) => x.text.includes("Montreal"))).toBe(true);
  });
});
