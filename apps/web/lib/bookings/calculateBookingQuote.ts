/**
 * Live BNHUB quote in major currency units (floats) for public APIs / UI.
 * Authoritative money remains cents in `computeBookingPricing`.
 */

import { computeBookingPricing, type PricingBreakdown } from "@/lib/bnhub/booking-pricing";
import { isListingAvailable } from "@/lib/bnhub/listings";
import { softDemandLineForQuoteRange } from "@/lib/bnhub/soft-demand-signals";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

export type BookingQuoteDollars = {
  nights: number;
  baseAmount: number;
  /** Nightly subtotal before lodging discount (for line-item display). */
  grossSubtotalCents: number;
  cleaningFee: number;
  serviceFee: number;
  taxesAmount: number;
  totalAmount: number;
  currency: string;
  /** Optional detail for UI */
  breakdown?: Pick<
    PricingBreakdown,
    | "earlyBookingDiscountCents"
    | "earlyBookingLabel"
    | "lodgingSubtotalAfterDiscountCents"
    | "loyaltyDiscountCents"
    | "loyaltyDiscountLabel"
    | "loyaltyTierCode"
    | "loyaltyDiscountPercentOffered"
    | "lodgingDiscountAppliedCents"
    | "lodgingDiscountSource"
  >;
  /** Optional soft demand hint for selected dates (calendar-backed when possible). */
  softDemandLine?: string | null;
};

function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export type CalculateBookingQuoteInput = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestsCount?: number;
  /** When set, loyalty vs promo rules apply (best single discount on lodging). */
  guestUserId?: string;
};

/**
 * Quote only — does not persist. Validates listing exists and is published.
 */
export async function calculateBookingQuote(
  input: CalculateBookingQuoteInput
): Promise<
  | { ok: true; quote: BookingQuoteDollars }
  | { ok: false; httpStatus: number; error: string }
> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    select: { id: true, listingStatus: true, maxGuests: true },
  });
  if (!listing) {
    return { ok: false, httpStatus: 404, error: "Listing not found." };
  }
  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return { ok: false, httpStatus: 403, error: "This listing is not available for booking." };
  }

  const guests = input.guestsCount;
  if (typeof guests === "number" && (guests < 1 || guests > listing.maxGuests)) {
    return {
      ok: false,
      httpStatus: 400,
      error: `Guest count must be between 1 and ${listing.maxGuests}.`,
    };
  }

  const priced = await computeBookingPricing({
    listingId: input.listingId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestCount: typeof guests === "number" ? guests : undefined,
    guestUserId: input.guestUserId,
  });
  if (!priced) {
    return { ok: false, httpStatus: 400, error: "Invalid dates or could not compute pricing." };
  }

  const available = await isListingAvailable(
    input.listingId,
    new Date(input.checkIn),
    new Date(input.checkOut)
  );
  if (!available) {
    return { ok: false, httpStatus: 409, error: "Selected dates are no longer available." };
  }

  const softDemandLine = await softDemandLineForQuoteRange(
    input.listingId,
    input.checkIn,
    input.checkOut
  );

  const b = priced.breakdown;
  const lodgingBaseCents = b.lodgingSubtotalAfterDiscountCents;
  const quote: BookingQuoteDollars = {
    nights: b.nights,
    baseAmount: centsToAmount(lodgingBaseCents),
    grossSubtotalCents: b.subtotalCents,
    cleaningFee: centsToAmount(b.cleaningFeeCents),
    serviceFee: centsToAmount(b.serviceFeeCents),
    taxesAmount: centsToAmount(b.taxCents),
    totalAmount: centsToAmount(b.totalCents),
    currency: (b.currency || "CAD").toUpperCase(),
    breakdown: {
      earlyBookingDiscountCents: b.earlyBookingDiscountCents,
      earlyBookingLabel: b.earlyBookingLabel,
      lodgingSubtotalAfterDiscountCents: b.lodgingSubtotalAfterDiscountCents,
      loyaltyDiscountCents: b.loyaltyDiscountCents,
      loyaltyDiscountLabel: b.loyaltyDiscountLabel,
      loyaltyTierCode: b.loyaltyTierCode,
      loyaltyDiscountPercentOffered: b.loyaltyDiscountPercentOffered,
      lodgingDiscountAppliedCents: b.lodgingDiscountAppliedCents,
      lodgingDiscountSource: b.lodgingDiscountSource,
    },
    softDemandLine,
  };

  return { ok: true, quote };
}
