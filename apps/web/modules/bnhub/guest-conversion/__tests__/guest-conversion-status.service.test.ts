import { describe, expect, it } from "vitest";
import { classifyGuestConversionStatus } from "../guest-conversion-status.service";

describe("classifyGuestConversionStatus", () => {
  it("returns strong for healthy funnel with low friction", () => {
    const s = classifyGuestConversionStatus({
      searchMetrics: { clickThroughRate: 5 },
      listingMetrics: {
        listingViews: 40,
        bookingStarts: 6,
        bookingCompletions: 3,
        viewToStartRate: 15,
        startToBookingRate: 50,
      },
      frictionSignals: [],
    });
    expect(s).toBe("strong");
  });

  it("returns weak for multiple high-severity friction", () => {
    const s = classifyGuestConversionStatus({
      searchMetrics: {},
      listingMetrics: { listingViews: 10, bookingStarts: 5, bookingCompletions: 0 },
      frictionSignals: [
        { title: "a", severity: "high", why: "x" },
        { title: "b", severity: "high", why: "y" },
      ],
    });
    expect(s).toBe("weak");
  });
});
