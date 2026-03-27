/**
 * Monetization calculator tests – booking fees, transaction fees.
 * Run: npx vitest run lib/monetization/__tests__/calculators.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  calculateBookingFees,
  GUEST_SERVICE_FEE_PERCENT,
  HOST_FEE_PERCENT,
} from "../calculators/booking-fees";
import {
  calculateTransactionFee,
  MIN_FEE_CENTS,
  MAX_FEE_CENTS,
  TRANSACTION_FEE_PERCENT,
} from "../calculators/transaction-fees";
import { calculateQuebecRetailTaxOnLodgingBaseExclusiveCents } from "@/lib/tax/quebec-tax-engine";

describe("Booking fee calculation", () => {
  it("computes guest service fee and host fee from subtotal", () => {
    const result = calculateBookingFees({ subtotalCents: 10000 });
    expect(result.subtotalCents).toBe(10000);
    expect(result.guestServiceFeeCents).toBe(Math.round((10000 * GUEST_SERVICE_FEE_PERCENT) / 100));
    expect(result.hostFeeCents).toBe(Math.round((10000 * HOST_FEE_PERCENT) / 100));
    expect(result.platformRevenueCents).toBe(
      result.guestServiceFeeCents + result.hostFeeCents
    );
  });

  it("includes cleaning fee and Québec GST+QST (compound) in totals", () => {
    const result = calculateBookingFees({
      subtotalCents: 30000,
      cleaningFeeCents: 5000,
    });
    const expectedTax = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(35000);
    expect(result.cleaningFeeCents).toBe(5000);
    expect(result.gstCents).toBe(expectedTax.gstCents);
    expect(result.qstCents).toBe(expectedTax.qstCents);
    expect(result.taxCents).toBe(expectedTax.taxCents);
    expect(result.totalCents).toBe(
      result.subtotalCents +
        result.cleaningFeeCents +
        result.taxCents +
        result.guestServiceFeeCents
    );
    expect(result.hostPayoutCents).toBe(
      result.subtotalCents + result.cleaningFeeCents - result.hostFeeCents
    );
  });

  it("handles zero subtotal", () => {
    const result = calculateBookingFees({ subtotalCents: 0 });
    expect(result.guestServiceFeeCents).toBe(0);
    expect(result.hostFeeCents).toBe(0);
    expect(result.platformRevenueCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.hostPayoutCents).toBe(0);
  });
});

describe("Transaction fee calculation", () => {
  it("applies default percentage with min/max clamp", () => {
    const small = calculateTransactionFee({ transactionValueCents: 1000 });
    expect(small.platformFeeCents).toBe(MIN_FEE_CENTS);

    const large = calculateTransactionFee({ transactionValueCents: 100_000_000 });
    expect(large.platformFeeCents).toBe(MAX_FEE_CENTS);

    const mid = calculateTransactionFee({ transactionValueCents: 1_000_000 }); // $10k
    expect(mid.platformFeeCents).toBe(Math.round((1_000_000 * TRANSACTION_FEE_PERCENT) / 100));
  });

  it("accepts custom fee percent", () => {
    const result = calculateTransactionFee({
      transactionValueCents: 100_000,
      feePercent: 1,
    });
    expect(result.feePercent).toBe(1);
    expect(result.platformFeeCents).toBe(1000);
  });

  it("returns transaction value in output", () => {
    const result = calculateTransactionFee({ transactionValueCents: 50_000 });
    expect(result.transactionValueCents).toBe(50_000);
  });
});
