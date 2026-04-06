import { describe, expect, it } from "vitest";
import { canTransitionBookingStatus } from "@/lib/bookings/transitions";

describe("canTransitionBookingStatus", () => {
  it("allows system to confirm paid online booking from PENDING", () => {
    expect(
      canTransitionBookingStatus("PENDING", "CONFIRMED", { paymentMode: "online", actor: "system" }),
    ).toBe(true);
  });

  it("denies guest confirming PENDING online booking", () => {
    expect(
      canTransitionBookingStatus("PENDING", "CONFIRMED", { paymentMode: "online", actor: "guest" }),
    ).toBe(false);
  });

  it("allows host to confirm manual PENDING booking", () => {
    expect(
      canTransitionBookingStatus("PENDING", "CONFIRMED", { paymentMode: "manual", actor: "host" }),
    ).toBe(true);
  });
});
