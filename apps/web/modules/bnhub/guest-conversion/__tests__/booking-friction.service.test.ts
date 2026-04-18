import { describe, expect, it } from "vitest";
import { detectBookingFrictionSignals } from "../booking-friction.service";
import type { GuestConversionFrictionContext } from "../guest-conversion.types";

function baseCtx(over: Partial<GuestConversionFrictionContext>): GuestConversionFrictionContext {
  return {
    listingId: "x",
    windowDays: 30,
    searchMetrics: {},
    listingMetrics: {},
    reviewCount: 0,
    photoCount: 6,
    hasDescription: true,
    nightPriceCents: 10000,
    ...over,
  };
}

describe("detectBookingFrictionSignals", () => {
  it("flags listing-page friction when many views and few starts", () => {
    const s = detectBookingFrictionSignals(
      baseCtx({
        listingMetrics: { listingViews: 20, bookingStarts: 0, bookingCompletions: 0 },
      }),
    );
    expect(s.some((x) => x.title.includes("Listing page"))).toBe(true);
  });

  it("flags checkout friction when starts exist but no paid", () => {
    const s = detectBookingFrictionSignals(
      baseCtx({
        listingMetrics: { listingViews: 10, bookingStarts: 4, bookingCompletions: 0 },
      }),
    );
    expect(s.some((x) => x.title.includes("Checkout"))).toBe(true);
  });

  it("does not mutate input", () => {
    const ctx = baseCtx({
      listingMetrics: { listingViews: 2, bookingStarts: 1 },
    });
    const copy = JSON.parse(JSON.stringify(ctx));
    detectBookingFrictionSignals(ctx);
    expect(ctx).toEqual(copy);
  });
});
