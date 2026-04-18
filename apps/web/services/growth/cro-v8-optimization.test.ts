import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCroV8FunnelComparison,
  pickCroPrimaryStageId,
  resetCroV8FunnelComparisonSessionForTests,
} from "./cro-v8-funnel-comparison.service";
import { computeFunnelMetrics, detectFunnelLeaks } from "./funnel-analysis.service";
import { analyzeCroV8Dropoffs, buildCroV8ShadowRecommendations } from "./cro-v8-optimization.service";
import type { CroV8DropoffPoint } from "./cro-v8-optimization.types";

describe("cro-v8-optimization", () => {
  it("analyzeCroV8Dropoffs returns four stage rows", () => {
    const m = computeFunnelMetrics({
      landing_view: 1000,
      cta_click: 40,
      lead_capture: 10,
      booking_started: 4,
      booking_completed: 3,
    });
    const d = analyzeCroV8Dropoffs(m);
    expect(d).toHaveLength(4);
    expect(d[0].fromStep).toBe("landing_view");
  });

  it("buildCroV8ShadowRecommendations stays shadow_manual", () => {
    const m = computeFunnelMetrics({
      landing_view: 100,
      cta_click: 1,
      lead_capture: 1,
      booking_started: 1,
      booking_completed: 0,
    });
    const leaks = detectFunnelLeaks(m);
    const drops = analyzeCroV8Dropoffs(m);
    const s = buildCroV8ShadowRecommendations(leaks, drops);
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.executionMode === "shadow_manual")).toBe(true);
  });
});

describe("cro-v8 funnel comparison (read-only)", () => {
  beforeEach(() => {
    resetCroV8FunnelComparisonSessionForTests();
  });

  it("aligns rows with four canonical stages", () => {
    const m = computeFunnelMetrics({
      landing_view: 1000,
      cta_click: 40,
      lead_capture: 10,
      booking_started: 4,
      booking_completed: 3,
    });
    const drops = analyzeCroV8Dropoffs(m);
    const r = buildCroV8FunnelComparison(m, drops, [], []);
    expect(r.rows).toHaveLength(4);
    expect(r.rows.map((x) => x.stage)).toEqual([
      "landing_to_cta",
      "cta_to_lead",
      "lead_to_booking_start",
      "booking_start_to_complete",
    ]);
    expect(r.quality.insufficientData).toBe(false);
  });

  it("marks insufficient data for very low volume", () => {
    const m = computeFunnelMetrics({
      landing_view: 2,
      cta_click: 1,
      lead_capture: 0,
      booking_started: 0,
      booking_completed: 0,
    });
    const drops = analyzeCroV8Dropoffs(m);
    const r = buildCroV8FunnelComparison(m, drops, [], []);
    expect(r.quality.insufficientData).toBe(true);
  });

  it("detects bottleneck mismatch when priority tier ignores max-gap stage", () => {
    const m = computeFunnelMetrics({
      landing_view: 100,
      cta_click: 10,
      lead_capture: 10,
      booking_started: 1,
      booking_completed: 1,
    });
    const synthetic: CroV8DropoffPoint[] = [
      {
        id: "landing_to_cta",
        fromStep: "landing_view",
        toStep: "cta_click",
        observedRatio: m.ctr,
        benchmarkRatio: 0.03,
        gapVsBenchmark: 0.01,
        severity: "priority",
        notes: [],
      },
      {
        id: "cta_to_lead",
        fromStep: "cta_click",
        toStep: "lead_capture",
        observedRatio: m.clickToLead,
        benchmarkRatio: 0.15,
        gapVsBenchmark: 0.5,
        severity: "watch",
        notes: [],
      },
      {
        id: "lead_to_booking_start",
        fromStep: "lead_capture",
        toStep: "booking_started",
        observedRatio: m.leadToBooking,
        benchmarkRatio: 0.2,
        gapVsBenchmark: 0.05,
        severity: "watch",
        notes: [],
      },
      {
        id: "booking_start_to_complete",
        fromStep: "booking_started",
        toStep: "booking_completed",
        observedRatio: m.completionRate,
        benchmarkRatio: 0.7,
        gapVsBenchmark: 0.01,
        severity: "info",
        notes: [],
      },
    ];
    expect(pickCroPrimaryStageId(synthetic)).toBe("landing_to_cta");
    const r = buildCroV8FunnelComparison(m, synthetic, [], []);
    expect(r.quality.groundTruthWeakestStageId).toBe("cta_to_lead");
    expect(r.quality.bottleneckMatch).toBe(false);
    expect(r.quality.falsePositiveEstimate).toBe(true);
    expect(r.sampleIncorrectClassifications.length).toBeGreaterThan(0);
  });

  it("keeps bottleneck match when CRO primary matches max-gap stage", () => {
    const m = computeFunnelMetrics({
      landing_view: 100,
      cta_click: 1,
      lead_capture: 1,
      booking_started: 1,
      booking_completed: 0,
    });
    const drops = analyzeCroV8Dropoffs(m);
    const leaks = detectFunnelLeaks(m);
    const recs = buildCroV8ShadowRecommendations(leaks, drops);
    const r = buildCroV8FunnelComparison(m, drops, recs, leaks.map((l) => l.stage));
    expect(r.quality.groundTruthWeakestStageId).toBe(
      drops.reduce((a, b) => (a.gapVsBenchmark >= b.gapVsBenchmark ? a : b)).id,
    );
    expect(r.quality.bottleneckMatch).toBe(true);
  });
});
