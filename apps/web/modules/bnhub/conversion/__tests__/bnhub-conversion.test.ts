import { describe, expect, it } from "vitest";
import { computeBnhubConversionMetrics } from "../bnhub-guest-conversion-metrics";
import { analyzeBNHubConversion } from "../bnhub-guest-conversion-analyzer.service";
import { detectBNHubFriction } from "../bnhub-friction-detector.service";
import { resetBnhubConversionMonitoringForTests } from "../bnhub-conversion-monitoring.service";
import type { BNHubConversionMetrics } from "../bnhub-guest-conversion.types";

describe("computeBnhubConversionMetrics", () => {
  it("handles zeros without NaN", () => {
    const m = computeBnhubConversionMetrics({}, {});
    expect(m.ctr).toBe(0);
    expect(m.viewRate).toBe(0);
    expect(m.bookingRate).toBe(0);
    expect(m.impressions).toBe(0);
  });

  it("does not mutate input objects", () => {
    const search = Object.freeze({ impressions: 100, clicks: 12 });
    const listing = Object.freeze({ listingViews: 40, bookingStarts: 3, bookingCompletions: 1 });
    computeBnhubConversionMetrics(search, listing);
    expect(search.impressions).toBe(100);
  });
});

describe("analyzeBNHubConversion", () => {
  it("produces strong_performance when thresholds met", () => {
    resetBnhubConversionMonitoringForTests();
    const m: BNHubConversionMetrics = {
      impressions: 100,
      clicks: 20,
      views: 15,
      bookingStarts: 2,
      bookingsCompleted: 2,
      ctr: 0.2,
      viewRate: 0.75,
      bookingRate: 0.13,
    };
    const insights = analyzeBNHubConversion(m);
    expect(insights.some((i) => i.type === "strong_performance")).toBe(true);
  });
});

describe("detectBNHubFriction", () => {
  it("flags many starts without completions", () => {
    resetBnhubConversionMonitoringForTests();
    const m: BNHubConversionMetrics = {
      impressions: 80,
      clicks: 40,
      views: 30,
      bookingStarts: 6,
      bookingsCompleted: 0,
      ctr: 0.5,
      viewRate: 0.75,
      bookingRate: 0,
    };
    const f = detectBNHubFriction(m);
    expect(f.some((x) => x.type === "friction_detected")).toBe(true);
  });
});
