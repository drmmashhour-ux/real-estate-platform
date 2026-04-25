/**
 * BNHub booking revenue — public entry for pricing + payout math.
 *
 * **Persistence (do not add a second `Booking` model):**
 * - Guest total (major units) ≈ `Booking.priceSnapshotTotalCents / 100` or `Payment.amountCents / 100`
 * - Platform service fee ≈ `Booking.guestFeeCents / 100` (and/or `Payment.platformFeeCents` when Stripe captures application fee)
 * - Host/base (pre platform fee on guest base) ≈ lodging + cleaning + upsells before fee — align with `calculateBookingTotalCents().baseAmountCents`
 * - `Booking.guestId` is the booker (`userId` in simplified sketches)
 *
 * **Stripe:** `createCheckoutSession` (`lib/stripe/checkout.ts`) accepts `bookingId` + `listingId`; metadata is validated in `checkoutMetadata.ts`.
 */

export {
  BNHUB_PLATFORM_FEE_PERCENT_MAX,
  BNHUB_PLATFORM_FEE_PERCENT_MIN,
  calculateBookingTotal,
  calculateBookingTotalCents,
  resolveBnhubPlatformGuestFeePercent,
  type BookingRevenueBreakdownCents,
  type CalculateBookingTotalOptions,
} from "@/lib/bnhub/booking-revenue-pricing";

export type { BnhubUpsellSelection } from "@/lib/monetization/bnhub-checkout-pricing";

/** Host receives everything in the guest “base” before platform fee (nights + extras + upsells). */
export function hostReceivesFromBreakdownCents(b: { baseAmountCents: number }): number {
  return b.baseAmountCents;
}
