import { describe, expect, it } from "vitest";
import { formatConversionMonitoringSnapshot } from "@/modules/conversion/conversion-monitoring-verify";

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
});
