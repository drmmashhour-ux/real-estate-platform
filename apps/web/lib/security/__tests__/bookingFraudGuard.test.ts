import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/flags", () => ({
  flags: { COMPLIANCE_HARD_LOCK: true },
}));

import { assertBookingFraudAllowed } from "@/lib/security/bookingFraudGuard";

describe("assertBookingFraudAllowed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws on extreme subtotal vs base stay ratio", () => {
    expect(() =>
      assertBookingFraudAllowed({
        clientIp: null,
        baseStayCents: 10_000,
        subtotalCents: 500,
      })
    ).toThrow(/Pricing/);
  });
});
