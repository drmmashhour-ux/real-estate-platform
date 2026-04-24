import { describe, expect, it } from "vitest";
import type { GuestBehaviorProfile } from "../types";
import { computeReturnScore } from "../return-score";

describe("computeReturnScore", () => {
  it("scores higher with more bookings and saves", () => {
    const base: GuestBehaviorProfile = {
      userId: "x",
      accountCreatedAt: new Date(),
      searchEvents30d: 0,
      clientSearchEvents30d: 0,
      behaviorEngagement30d: 0,
      distinctListingViews30d: 0,
      savesTotal: 0,
      completedBookings: 0,
      lastBookingCheckOut: null,
      lastActivityAt: new Date(),
      bookingCities: [],
    };
    const low = computeReturnScore(base);
    const high = computeReturnScore({
      ...base,
      completedBookings: 3,
      savesTotal: 4,
      searchEvents30d: 10,
      lastActivityAt: new Date(),
    });
    expect(high.score).toBeGreaterThan(low.score);
  });
});
