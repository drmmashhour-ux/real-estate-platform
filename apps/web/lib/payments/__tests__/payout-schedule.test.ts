import { describe, expect, it } from "vitest";
import { computePayoutScheduledAt } from "@/lib/payments/payout";

describe("computePayoutScheduledAt", () => {
  it("adds 24 hours to check-in", () => {
    const checkIn = new Date("2026-06-01T15:00:00.000Z");
    const scheduled = computePayoutScheduledAt(checkIn);
    expect(scheduled.getTime()).toBe(checkIn.getTime() + 24 * 60 * 60 * 1000);
  });
});
