import { describe, expect, it } from "vitest";
import { computeConversionMonitoringAlerts } from "@/modules/conversion/conversion-monitoring-alerts";

function baseSnapshot(
  overrides: Partial<{
    leadFormStarts: number;
    leadSubmits: number;
    surfaceViewsByKey: Record<string, number>;
    listingCtaClicks: number;
    propertyCtaClicks: number;
    brokerPreviewCtaClicks: number;
  }> = {},
) {
  return {
    heroClicks: 0,
    intentSelections: 0,
    leadFormStarts: 0,
    leadSubmits: 0,
    listingCtaClicks: 0,
    propertyCtaClicks: 0,
    brokerPreviewCtaClicks: 0,
    surfaceViewsByKey: {},
    ...overrides,
  };
}

describe("computeConversionMonitoringAlerts", () => {
  it("warns when there are starts but no submits", () => {
    const alerts = computeConversionMonitoringAlerts(
      baseSnapshot({ leadFormStarts: 2, leadSubmits: 0, surfaceViewsByKey: { "get-leads": 2 } }),
    );
    expect(alerts.some((a) => a.code === "lead_submit_zero_with_engagement")).toBe(true);
  });

  it("warns on sustained starts without submits", () => {
    const alerts = computeConversionMonitoringAlerts(baseSnapshot({ leadFormStarts: 5, leadSubmits: 0 }));
    expect(alerts.some((a) => a.code === "high_start_vs_submit_gap")).toBe(true);
  });

  it("warns when CTAs stay at zero despite traffic", () => {
    const alerts = computeConversionMonitoringAlerts(
      baseSnapshot({
        surfaceViewsByKey: { x: 12 },
        leadFormStarts: 4,
        listingCtaClicks: 0,
        propertyCtaClicks: 0,
        brokerPreviewCtaClicks: 0,
      }),
    );
    expect(alerts.some((a) => a.code === "cta_zero_with_traffic")).toBe(true);
  });
});
