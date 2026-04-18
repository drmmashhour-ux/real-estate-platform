import { describe, expect, it } from "vitest";
import {
  assertMonitoringSnapshotNumericKeys,
  formatConversionMonitoringSnapshot,
  formatConversionMonitoringVerificationGuide,
  summarizeMonitoringLine,
} from "@/modules/conversion/conversion-monitoring-verify";

describe("conversion-monitoring-verify", () => {
  it("formatConversionMonitoringSnapshot lists all counters", () => {
    const out = formatConversionMonitoringSnapshot({
      heroClicks: 1,
      intentSelections: 2,
      leadFormStarts: 3,
      leadSubmits: 4,
      listingCtaClicks: 5,
      propertyCtaClicks: 6,
      brokerPreviewCtaClicks: 7,
      surfaceViewsByKey: { "get-leads": 2 },
    });
    expect(out).toContain("leadFormStarts: 3");
    expect(out).toContain("brokerPreviewCtaClicks: 7");
    expect(out).toContain("surfaceViewsByKey:");
    expect(out).toContain("get-leads");
  });

  it("formatConversionMonitoringVerificationGuide lists record* helpers", () => {
    const g = formatConversionMonitoringVerificationGuide();
    expect(g).toContain("recordLeadFormStart");
    expect(g).toContain("recordListingCtaClick");
  });

  it("assertMonitoringSnapshotNumericKeys returns missing keys only", () => {
    expect(assertMonitoringSnapshotNumericKeys({ leadFormStarts: 1 } as never)).toContain("heroClicks");
    expect(
      assertMonitoringSnapshotNumericKeys({
        heroClicks: 0,
        intentSelections: 0,
        leadFormStarts: 0,
        leadSubmits: 0,
        listingCtaClicks: 0,
        propertyCtaClicks: 0,
        brokerPreviewCtaClicks: 0,
        surfaceViewsByKey: {},
      }),
    ).toHaveLength(0);
  });

  it("summarizeMonitoringLine is compact", () => {
    const line = summarizeMonitoringLine({
      heroClicks: 1,
      intentSelections: 2,
      leadFormStarts: 3,
      leadSubmits: 4,
      listingCtaClicks: 5,
      propertyCtaClicks: 6,
      brokerPreviewCtaClicks: 7,
      surfaceViewsByKey: {},
    });
    expect(line).toContain("leadFormStarts=3");
  });
});
