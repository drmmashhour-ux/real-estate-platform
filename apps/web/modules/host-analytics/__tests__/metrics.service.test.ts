import { describe, expect, it } from "vitest";
import { hostRevenueCentsForBooking } from "../metrics.service";

describe("hostRevenueCentsForBooking", () => {
  it("uses completed payment host payout when present", () => {
    expect(
      hostRevenueCentsForBooking({
        totalCents: 10000,
        hostFeeCents: 300,
        payment: { status: "COMPLETED", hostPayoutCents: 8800 },
        bnhubInvoice: null,
      }),
    ).toBe(8800);
  });

  it("falls back to invoice host payout", () => {
    expect(
      hostRevenueCentsForBooking({
        totalCents: 10000,
        hostFeeCents: 300,
        payment: null,
        bnhubInvoice: { hostPayoutCents: 8700 },
      }),
    ).toBe(8700);
  });

  it("falls back to total minus host fee", () => {
    expect(
      hostRevenueCentsForBooking({
        totalCents: 10000,
        hostFeeCents: 300,
        payment: { status: "PENDING", hostPayoutCents: null },
        bnhubInvoice: { hostPayoutCents: null },
      }),
    ).toBe(9700);
  });
});
