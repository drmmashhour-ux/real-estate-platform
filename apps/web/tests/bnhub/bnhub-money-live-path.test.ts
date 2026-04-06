import { describe, expect, it } from "vitest";
import { buildBookingMoneyBreakdown } from "@/lib/bookings/money";
import { schedulePayoutForBooking, computePayoutScheduledAt, executeOrchestratedPayout } from "@/lib/payments/payout";
import { runBnhubPayoutRunner } from "@/lib/payouts/runner";
import { refreshHostStripeAccountSnapshotForHost } from "@/lib/stripe/connect/persist-snapshot";

/**
 * Ensures the BNHub money modules export and core helpers run (no DB).
 * Full E2E requires migrate + Stripe + `scripts/bnhub-money-layer-schema-verify.ts`.
 */
describe("bnhub money live path surface", () => {
  it("exports payout + runner + snapshot refresh + money breakdown", () => {
    expect(typeof schedulePayoutForBooking).toBe("function");
    expect(typeof computePayoutScheduledAt).toBe("function");
    expect(typeof executeOrchestratedPayout).toBe("function");
    expect(typeof runBnhubPayoutRunner).toBe("function");
    expect(typeof refreshHostStripeAccountSnapshotForHost).toBe("function");
    const b = buildBookingMoneyBreakdown({
      bookingId: "t1",
      nights: 1,
      nightlyRateCents: 10000,
    });
    expect(b.totalChargeCents).toBeGreaterThan(0);
  });
});
