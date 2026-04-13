import type { BookingMoneyBreakdown } from "@/lib/payments/bnhub-money-types";
import type { PricingBreakdown } from "@/lib/bnhub/booking-pricing";

export interface BuildBookingMoneyInput {
  bookingId: string;
  nights: number;
  /** When set, overrides `nights * nightlyRateCents` for subtotal. */
  subtotalCents?: number;
  nightlyRateCents?: number;
  cleaningFeeCents?: number;
  taxesCents?: number;
  guestServiceFeeCents?: number;
  hostFeePercent?: number;
}

/**
 * Spec-aligned helper: platform fee applies to lodging subtotal only; guest service fee and taxes stay with platform collection.
 * Prefer `bookingMoneyBreakdownFromPricingBreakdown` when a full `PricingBreakdown` is available (production checkout).
 */
export function buildBookingMoneyBreakdown(input: BuildBookingMoneyInput): BookingMoneyBreakdown {
  const subtotalCents =
    typeof input.subtotalCents === "number"
      ? Math.max(0, Math.round(input.subtotalCents))
      : Math.max(0, Math.round(input.nights * (input.nightlyRateCents ?? 0)));
  const cleaningFeeCents = input.cleaningFeeCents ?? 0;
  const taxesCents = input.taxesCents ?? 0;
  const guestServiceFeeCents = input.guestServiceFeeCents ?? 0;

  const hostFeePercent = input.hostFeePercent ?? 0.1;
  const platformRevenueCents = Math.round(subtotalCents * hostFeePercent);
  const hostPayoutCents = subtotalCents + cleaningFeeCents - platformRevenueCents;

  const totalChargeCents = subtotalCents + cleaningFeeCents + taxesCents + guestServiceFeeCents;

  return {
    bookingId: input.bookingId,
    currency: "cad",
    subtotalCents,
    cleaningFeeCents,
    taxesCents,
    guestServiceFeeCents,
    hostPayoutCents: Math.max(0, hostPayoutCents),
    platformRevenueCents: Math.min(platformRevenueCents, subtotalCents + cleaningFeeCents),
    totalChargeCents,
  };
}

/** Maps the BNHUB pricing engine breakdown into the canonical money shape (single source for persisted JSON). */
export function bookingMoneyBreakdownFromPricingBreakdown(
  bookingId: string,
  b: PricingBreakdown
): BookingMoneyBreakdown {
  const currency = (b.currency ?? "cad").toLowerCase() === "cad" ? "cad" : "cad";
  const platformRevenueCents = Math.max(0, b.hostFeeCents + b.addonsHostFeeCents);
  return {
    bookingId,
    currency,
    subtotalCents: Math.max(0, b.lodgingSubtotalAfterDiscountCents),
    cleaningFeeCents: Math.max(0, b.cleaningFeeCents),
    taxesCents: Math.max(0, b.taxCents),
    guestServiceFeeCents: Math.max(0, b.serviceFeeCents),
    hostPayoutCents: Math.max(0, b.hostPayoutCents),
    platformRevenueCents,
    totalChargeCents: Math.max(0, b.totalCents),
  };
}
