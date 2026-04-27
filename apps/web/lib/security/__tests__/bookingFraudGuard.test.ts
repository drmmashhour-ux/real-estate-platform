import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/flags", () => ({
  flags: { COMPLIANCE_HARD_LOCK: true },
}));

import { assertBookingFraudAllowed } from "@/lib/security/bookingFraudGuard";

function okPrices() {
  return { baseStayCents: 10_000, subtotalCents: 10_000 + 0 + 0 };
}

describe("assertBookingFraudAllowed", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    warn.mockClear();
  });

  it("throws on extreme subtotal vs base stay ratio and logs FRAUD BLOCK", () => {
    expect(() =>
      assertBookingFraudAllowed({
        clientIp: null,
        userId: "u-1",
        baseStayCents: 10_000,
        subtotalCents: 500,
      })
    ).toThrow(/Pricing/);
    expect(warn).toHaveBeenCalledWith(
      "FRAUD BLOCK:",
      expect.objectContaining({ userId: "u-1", reason: "subtotal_base_ratio" })
    );
  });

  it("blocks 6th booking attempt in one hour for same user (IP optional)", () => {
    for (let i = 0; i < 5; i++) {
      assertBookingFraudAllowed({ clientIp: null, userId: "u-vel", ...okPrices() });
      vi.advanceTimersByTime(60_000);
    }
    expect(() =>
      assertBookingFraudAllowed({ clientIp: null, userId: "u-vel", ...okPrices() })
    ).toThrow(/Too many booking attempts for this account/);
    expect(warn).toHaveBeenCalledWith(
      "FRAUD BLOCK:",
      expect.objectContaining({ userId: "u-vel", reason: "user_booking_velocity" })
    );
  });
});
