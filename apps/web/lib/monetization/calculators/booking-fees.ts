/**
 * BNHub booking fee calculation – explicit, testable logic.
 * Aligns with lib/bnhub/booking-pricing.ts (Quebec GST + compound QST on lodging base).
 */

import { calculateQuebecRetailTaxOnLodgingBaseExclusiveCents } from "@/lib/tax/quebec-tax-engine";

const GUEST_SERVICE_FEE_PERCENT = 12;
const HOST_FEE_PERCENT = 3;

export interface BookingFeeInput {
  subtotalCents: number;
  cleaningFeeCents?: number;
}

export interface BookingFeeOutput {
  subtotalCents: number;
  cleaningFeeCents: number;
  gstCents: number;
  qstCents: number;
  taxCents: number;
  guestServiceFeeCents: number;
  hostFeeCents: number;
  totalCents: number;
  hostPayoutCents: number;
  platformRevenueCents: number;
}

/**
 * Compute guest service fee (charged to guest) and host fee (deducted from payout).
 * Total charged to guest = subtotal + cleaning + GST + QST + guestServiceFee.
 * Lodging tax: GST on (subtotal + cleaning), QST on (subtotal + cleaning + GST).
 * Host receives = subtotal + cleaning - hostFee.
 * Platform revenue = guestServiceFee + hostFee.
 */
export function calculateBookingFees(input: BookingFeeInput): BookingFeeOutput {
  const cleaningFeeCents = input.cleaningFeeCents ?? 0;
  const lodgingBase = input.subtotalCents + cleaningFeeCents;
  const { gstCents, qstCents, taxCents } =
    calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(lodgingBase);
  const guestServiceFeeCents = Math.round(
    (input.subtotalCents * GUEST_SERVICE_FEE_PERCENT) / 100
  );
  const hostFeeCents = Math.round(
    (input.subtotalCents * HOST_FEE_PERCENT) / 100
  );
  const totalCents =
    input.subtotalCents + cleaningFeeCents + taxCents + guestServiceFeeCents;
  const hostPayoutCents = input.subtotalCents + cleaningFeeCents - hostFeeCents;
  const platformRevenueCents = guestServiceFeeCents + hostFeeCents;

  return {
    subtotalCents: input.subtotalCents,
    cleaningFeeCents,
    gstCents,
    qstCents,
    taxCents,
    guestServiceFeeCents,
    hostFeeCents,
    totalCents,
    hostPayoutCents,
    platformRevenueCents,
  };
}

export { GUEST_SERVICE_FEE_PERCENT, HOST_FEE_PERCENT };
