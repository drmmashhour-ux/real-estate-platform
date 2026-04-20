import { describe, expect, it } from "vitest";
import { detectLowConversionPage } from "../detectors/low-conversion-page.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("detectLowConversionPage", () => {
  it("fires when traffic is high but contact ratio is below threshold", () => {
    const snap = emptyGrowthSnapshot({
      funnelRatiosByListing: [
        {
          listingId: "lst_bad",
          views: 80,
          contactClicks: 1,
          ratio: 1 / 80,
        },
      ],
    });
    expect(() => detectLowConversionPage(snap)).not.toThrow();
    const signals = detectLowConversionPage(snap);
    expect(signals.length).toBe(1);
    expect(signals[0]?.signalType).toBe("low_conversion_page");
    expect(signals[0]?.entityId).toBe("lst_bad");
  });

  it("does not fire when conversion is healthy", () => {
    const snap = emptyGrowthSnapshot({
      funnelRatiosByListing: [
        {
          listingId: "lst_ok",
          views: 60,
          contactClicks: 5,
          ratio: 5 / 60,
        },
      ],
    });
    expect(detectLowConversionPage(snap)).toHaveLength(0);
  });

  it("does not throw with no funnel rows", () => {
    expect(() => detectLowConversionPage(emptyGrowthSnapshot())).not.toThrow();
  });
});
