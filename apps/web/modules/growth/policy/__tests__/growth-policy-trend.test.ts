import { beforeEach, describe, expect, it } from "vitest";
import {
  detectOverallTrend,
  detectRecurrenceTrend,
  detectSeverityTrend,
  policyTrendRiskScore,
} from "../growth-policy-trend-detection.service";
import { buildPolicyDomainTrends } from "../growth-policy-trend-domain.service";
import {
  buildPolicyTrendHighlights,
  buildPolicyTrendWarnings,
} from "../growth-policy-trend-highlights.service";
import { buildGrowthPolicyTrendSummary } from "../growth-policy-trend.service";
import {
  buildPolicyTrendSeries,
  POLICY_TREND_MIN_DAYS_WITH_DATA,
} from "../growth-policy-trend-timeseries.service";
import type { PolicyTrendDailySnapshot } from "../growth-policy-trend.store";
import { replaceTrendDailyForTests, resetGrowthPolicyTrendStoreForTests } from "../growth-policy-trend.store";
import type { PolicyTrendPoint } from "../growth-policy-trend.types";

function point(p: Partial<PolicyTrendPoint> & { date: string }): PolicyTrendPoint {
  return {
    totalFindings: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    recurringCount: 0,
    resolvedCount: 0,
    hasData: true,
    ...p,
  };
}

describe("policyTrendRiskScore", () => {
  it("is zero without data", () => {
    expect(policyTrendRiskScore(point({ date: "2026-01-01", hasData: false }))).toBe(0);
  });
});

describe("buildPolicyTrendSeries", () => {
  beforeEach(() => {
    resetGrowthPolicyTrendStoreForTests();
  });

  it("marks insufficient when fewer than min snapshot days", () => {
    const ref = new Date("2026-01-10T15:00:00.000Z");
    const byDay: Record<string, PolicyTrendDailySnapshot> = {
      "2026-01-09": {
        dateUtc: "2026-01-09",
        updatedAt: ref.toISOString(),
        totalFindings: 1,
        criticalCount: 0,
        warningCount: 1,
        infoCount: 0,
        recurringCount: 0,
        resolvedReviewCount: 0,
        domainCounts: { ads: 1 },
      },
    };
    replaceTrendDailyForTests(byDay);
    const r = buildPolicyTrendSeries(7, ref);
    expect(r.daysWithData).toBe(1);
    expect(r.insufficientData).toBe(true);
    expect(r.series.filter((x) => x.hasData)).toHaveLength(1);
  });

  it("allows trends when enough snapshot days exist", () => {
    const ref = new Date("2026-01-10T15:00:00.000Z");
    const byDay: Record<string, PolicyTrendDailySnapshot> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 0, 10 - i));
      const key = d.toISOString().slice(0, 10);
      byDay[key] = {
        dateUtc: key,
        updatedAt: d.toISOString(),
        totalFindings: 1,
        criticalCount: 0,
        warningCount: 1,
        infoCount: 0,
        recurringCount: i % 3,
        resolvedReviewCount: 0,
        domainCounts: { ads: 1 },
      };
    }
    replaceTrendDailyForTests(byDay);
    const r = buildPolicyTrendSeries(7, ref);
    expect(r.daysWithData).toBe(7);
    expect(r.insufficientData).toBe(false);
    expect(POLICY_TREND_MIN_DAYS_WITH_DATA).toBe(3);
  });
});

describe("trend detection", () => {
  it("detects worsening overall when recent half risk higher", () => {
    const series: PolicyTrendPoint[] = [
      point({ date: "d1", criticalCount: 0, warningCount: 1 }),
      point({ date: "d2", criticalCount: 0, warningCount: 1 }),
      point({ date: "d3", criticalCount: 1, warningCount: 2 }),
      point({ date: "d4", criticalCount: 2, warningCount: 3 }),
    ];
    expect(detectOverallTrend(series, false)).toBe("worsening");
  });

  it("returns insufficient_data when flagged", () => {
    expect(detectSeverityTrend([], true)).toBe("insufficient_data");
    expect(detectRecurrenceTrend([], true)).toBe("insufficient_data");
  });
});

describe("domain trends", () => {
  beforeEach(() => resetGrowthPolicyTrendStoreForTests());

  it("shows worsening when ads grows in recent half", () => {
    const series: PolicyTrendPoint[] = [
      point({ date: "2026-01-01" }),
      point({ date: "2026-01-02" }),
      point({ date: "2026-01-03" }),
      point({ date: "2026-01-04" }),
    ];
    replaceTrendDailyForTests({
      "2026-01-01": snap("2026-01-01", { ads: 1 }),
      "2026-01-02": snap("2026-01-02", { ads: 1 }),
      "2026-01-03": snap("2026-01-03", { ads: 4 }),
      "2026-01-04": snap("2026-01-04", { ads: 5 }),
    });
    const domains = buildPolicyDomainTrends(series, false);
    const ads = domains.find((d) => d.domain === "ads");
    expect(ads?.trend).toBe("worsening");
    expect(ads?.explanation.length).toBeGreaterThan(10);
  });
});

function snap(dateUtc: string, domainCounts: Partial<Record<string, number>>): PolicyTrendDailySnapshot {
  return {
    dateUtc,
    updatedAt: `${dateUtc}T12:00:00.000Z`,
    totalFindings: Object.values(domainCounts).reduce((a, b) => a + (b ?? 0), 0),
    criticalCount: 0,
    warningCount: Object.values(domainCounts).reduce((a, b) => a + (b ?? 0), 0),
    infoCount: 0,
    recurringCount: 0,
    resolvedReviewCount: 0,
    domainCounts: domainCounts as PolicyTrendDailySnapshot["domainCounts"],
  };
}

describe("highlights", () => {
  it("warns on insufficient data", () => {
    const w = buildPolicyTrendWarnings({
      series: [],
      insufficientData: true,
      severityTrend: "insufficient_data",
      recurrenceTrend: "insufficient_data",
      daysWithData: 1,
      windowDays: 7,
      totalResolvedReviewsInWindow: 0,
    });
    expect(w.some((x) => x.includes("Requires"))).toBe(true);
  });
});

describe("buildGrowthPolicyTrendSummary", () => {
  beforeEach(() => resetGrowthPolicyTrendStoreForTests());

  it("is deterministic for fixed reference date and snapshots", () => {
    const ref = new Date("2026-01-10T12:00:00.000Z");
    const byDay: Record<string, PolicyTrendDailySnapshot> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(2026, 0, 10 - i));
      const key = d.toISOString().slice(0, 10);
      byDay[key] = {
        dateUtc: key,
        updatedAt: d.toISOString(),
        totalFindings: 2,
        criticalCount: 1,
        warningCount: 1,
        infoCount: 0,
        recurringCount: 0,
        resolvedReviewCount: 0,
        domainCounts: { governance: 2 },
      };
    }
    replaceTrendDailyForTests(byDay);
    const a = buildGrowthPolicyTrendSummary(7, ref);
    const b = buildGrowthPolicyTrendSummary(7, ref);
    expect(a.overallTrend).toBe(b.overallTrend);
    expect(a.series.length).toBe(7);
  });
});
