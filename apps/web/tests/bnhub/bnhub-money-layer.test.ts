import { describe, expect, it } from "vitest";
import { buildBookingMoneyBreakdown } from "@/lib/bookings/money";
import { evaluatePayoutEligibility } from "@/lib/payouts/eligibility";
import { refundGuardForPayout } from "@/lib/payments/refunds";
import type { BookingMoneyBreakdown } from "@/lib/payments/bnhub-money-types";

describe("buildBookingMoneyBreakdown", () => {
  it("computes subtotal, platform fee on subtotal, host payout, and total charge", () => {
    const b = buildBookingMoneyBreakdown({
      bookingId: "b1",
      nights: 3,
      nightlyRateCents: 10_000,
      cleaningFeeCents: 5000,
      taxesCents: 1200,
      guestServiceFeeCents: 800,
      hostFeePercent: 0.1,
    });
    expect(b.subtotalCents).toBe(30_000);
    expect(b.platformRevenueCents).toBe(3000);
    expect(b.hostPayoutCents).toBe(30_000 + 5000 - 3000);
    expect(b.totalChargeCents).toBe(30_000 + 5000 + 1200 + 800);
    expect(b.currency).toBe("cad");
  });
});

describe("evaluatePayoutEligibility", () => {
  it("returns not_ready when booking unpaid", () => {
    const r = evaluatePayoutEligibility({
      bookingPaid: false,
      hostHasConnectedAccount: true,
      payoutsEnabled: true,
      bookingCompleted: true,
      manualMarket: false,
    });
    expect(r.status).toBe("not_ready");
    expect(r.eligible).toBe(false);
  });

  it("returns manual for manual market", () => {
    const r = evaluatePayoutEligibility({
      bookingPaid: true,
      hostHasConnectedAccount: true,
      payoutsEnabled: true,
      bookingCompleted: true,
      manualMarket: true,
    });
    expect(r.status).toBe("manual");
  });

  it("returns manual when Connect not ready", () => {
    const r = evaluatePayoutEligibility({
      bookingPaid: true,
      hostHasConnectedAccount: false,
      payoutsEnabled: false,
      bookingCompleted: true,
      manualMarket: false,
    });
    expect(r.status).toBe("manual");
  });

  it("returns eligible when paid, connect ready, stay completed, online market", () => {
    const r = evaluatePayoutEligibility({
      bookingPaid: true,
      hostHasConnectedAccount: true,
      payoutsEnabled: true,
      bookingCompleted: true,
      manualMarket: false,
    });
    expect(r.eligible).toBe(true);
    expect(r.status).toBe("eligible");
  });
});

describe("refundGuardForPayout", () => {
  const breakdown: BookingMoneyBreakdown = {
    bookingId: "b1",
    currency: "cad",
    subtotalCents: 10000,
    cleaningFeeCents: 0,
    taxesCents: 0,
    guestServiceFeeCents: 0,
    hostPayoutCents: 9000,
    platformRevenueCents: 1000,
    totalChargeCents: 10000,
  };

  it("blocks when refund pending", () => {
    const g = refundGuardForPayout({
      bookingRefunded: false,
      paymentStatusRefunded: false,
      refundPending: true,
      partialRefundCents: 0,
      moneyBreakdown: breakdown,
      existingTransferId: null,
    });
    expect(g.allowTransfer).toBe(false);
    expect(g.reason).toBe("refund_pending");
  });

  it("blocks transfer when already sent", () => {
    const g = refundGuardForPayout({
      bookingRefunded: false,
      paymentStatusRefunded: false,
      refundPending: false,
      partialRefundCents: 0,
      moneyBreakdown: breakdown,
      existingTransferId: "tr_1",
    });
    expect(g.allowTransfer).toBe(false);
  });

  it("reduces payout on partial refund before transfer", () => {
    const g = refundGuardForPayout({
      bookingRefunded: false,
      paymentStatusRefunded: false,
      refundPending: false,
      partialRefundCents: 2000,
      moneyBreakdown: breakdown,
      existingTransferId: null,
    });
    expect(g.allowTransfer).toBe(true);
    expect(g.adjustedHostPayoutCents).toBe(7000);
  });
});
