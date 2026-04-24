import { describe, expect, it } from "vitest";
import type { GuestBehaviorProfile } from "../types";
import { resolveRetentionSegment } from "../segments";

function profile(p: Partial<GuestBehaviorProfile> & Pick<GuestBehaviorProfile, "userId" | "accountCreatedAt">): GuestBehaviorProfile {
  const now = new Date();
  return {
    searchEvents30d: 0,
    clientSearchEvents30d: 0,
    behaviorEngagement30d: 0,
    distinctListingViews30d: 0,
    savesTotal: 0,
    completedBookings: 0,
    lastBookingCheckOut: null,
    lastActivityAt: now,
    bookingCities: [],
    ...p,
  };
}

describe("resolveRetentionSegment", () => {
  it("classifies new users", () => {
    const s = resolveRetentionSegment(
      profile({
        userId: "u1",
        accountCreatedAt: new Date(),
        completedBookings: 0,
        lastActivityAt: new Date(),
      })
    );
    expect(s).toBe("new_user");
  });

  it("classifies returning users with multiple stays", () => {
    const s = resolveRetentionSegment(
      profile({
        userId: "u2",
        accountCreatedAt: new Date(Date.now() - 90 * 86_400_000),
        completedBookings: 2,
        lastActivityAt: new Date(),
      })
    );
    expect(s).toBe("returning_user");
  });

  it("classifies inactive users without recent activity", () => {
    const s = resolveRetentionSegment(
      profile({
        userId: "u3",
        accountCreatedAt: new Date(Date.now() - 400 * 86_400_000),
        completedBookings: 0,
        lastActivityAt: new Date(Date.now() - 120 * 86_400_000),
      })
    );
    expect(s).toBe("inactive_user");
  });
});
