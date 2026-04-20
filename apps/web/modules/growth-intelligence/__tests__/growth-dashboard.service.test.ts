import { describe, expect, it } from "vitest";
import {
  buildGrowthDashboardSummary,
  buildGrowthFunnelSummary,
  buildGrowthRegionOpportunitySummary,
  buildGrowthTrustLeverageSummary,
  buildGrowthTrendSummary,
} from "../growth-dashboard.service";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("growth-dashboard.service", () => {
  it("empty snapshot inputs yield explicit empty states", () => {
    const snap = emptyGrowthSnapshot();
    const dash = buildGrowthDashboardSummary({
      snapshotId: snap.id,
      collectedAt: snap.collectedAt,
      signals: [],
      opportunities: [],
      availabilityNotes: [],
    });
    expect(dash.topOpportunityIds).toHaveLength(0);
    expect(Object.keys(dash.signalCountsByType)).toHaveLength(0);
    expect(buildGrowthRegionOpportunitySummary([])).toHaveLength(0);
    expect(buildGrowthFunnelSummary([]).notes.join(" ")).toContain("No funnel");
    expect(buildGrowthTrustLeverageSummary([]).highTrustLowExposureCount).toBe(0);
    const emptyTrend = buildGrowthTrendSummary([]);
    expect(emptyTrend.trendSignalCount).toBe(0);
    expect(emptyTrend.notes.join(" ")).toContain("No timeline");
  });

  it("trust leverage counts trust_conversion signals", () => {
    const signals = [
      {
        id: "t1",
        signalType: "trust_conversion_opportunity" as const,
        severity: "info" as const,
        entityType: "fsbo_listing",
        entityId: "a",
        region: null,
        locale: "en",
        country: "ca",
        title: "",
        explanation: "",
        observedAt: "2026-04-01T12:00:00.000Z",
        metadata: {},
      },
    ];
    const t = buildGrowthTrustLeverageSummary(signals);
    expect(t.highTrustLowExposureCount).toBe(1);
    expect(t.notes[0]?.length).toBeGreaterThan(10);
  });

  it("buildGrowthTrendSummary counts timeline-derived signals", () => {
    const ts = buildGrowthTrendSummary([
      {
        id: "x",
        signalType: "stalled_funnel",
        severity: "warning",
        entityType: "workflow_segment",
        entityId: null,
        region: null,
        locale: "en",
        country: "ca",
        title: "",
        explanation: "",
        observedAt: "2026-04-01T12:00:00.000Z",
        metadata: {},
      },
    ]);
    expect(ts.stalledFunnelHints).toBe(1);
    expect(ts.trendSignalCount).toBe(1);
  });
});
