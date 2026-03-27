import { computeBookingPricing, type PricingBreakdown } from "@/lib/bnhub/booking-pricing";
import type { SelectedAddonInput } from "@/lib/bnhub/hospitality-addons";
import { prisma } from "@/lib/db";

const QUOTE_TTL_MS = 60 * 60 * 1000; // 1 hour

export type ReservationQuoteResult =
  | {
      ok: true;
      breakdown: PricingBreakdown;
      listingId: string;
      guestUserId: string;
      hostUserId: string;
      currency: string;
      grandTotalCents: number;
    }
  | { ok: false; error: string };

/**
 * Server-authoritative quote from booking rows + pricing engine (never trust client totals).
 */
export async function computeReservationQuoteFromBooking(bookingId: string): Promise<ReservationQuoteResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      listingId: true,
      guestId: true,
      checkIn: true,
      checkOut: true,
      listing: { select: { ownerId: true } },
      bnhubBookingServices: {
        select: { listingServiceId: true, quantity: true },
      },
    },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  const selectedAddons: SelectedAddonInput[] = booking.bnhubBookingServices.map((s) => ({
    listingServiceId: s.listingServiceId,
    quantity: s.quantity,
  }));

  const pricing = await computeBookingPricing({
    listingId: booking.listingId,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    selectedAddons: selectedAddons.length ? selectedAddons : undefined,
  });
  if (!pricing) return { ok: false, error: "Pricing unavailable" };

  const b = pricing.breakdown;
  return {
    ok: true,
    breakdown: b,
    listingId: booking.listingId,
    guestUserId: booking.guestId,
    hostUserId: booking.listing.ownerId,
    currency: (b.currency ?? "USD").toUpperCase(),
    grandTotalCents: b.totalCents,
  };
}

export function validateQuoteExpiration(expiresAt: Date): boolean {
  return expiresAt.getTime() > Date.now();
}

export async function createQuoteSnapshot(params: {
  bookingId: string | null;
  listingId: string;
  guestUserId: string;
  hostUserId: string;
  breakdown: PricingBreakdown;
  currency: string;
}) {
  const b = params.breakdown;
  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS);
  return prisma.bnhubPaymentQuote.create({
    data: {
      bookingId: params.bookingId,
      listingId: params.listingId,
      guestUserId: params.guestUserId,
      hostUserId: params.hostUserId,
      nightlySubtotalCents: b.subtotalCents,
      cleaningFeeCents: b.cleaningFeeCents,
      taxTotalCents: b.taxCents,
      serviceFeeCents: b.serviceFeeCents,
      addOnTotalCents: b.addonsSubtotalCents,
      bundleTotalCents: 0,
      membershipDiscountCents: 0,
      couponDiscountCents: 0,
      securityHoldCents: b.depositCents,
      grandTotalCents: b.totalCents,
      currency: params.currency,
      pricingSnapshotJson: b as object,
      expiresAt,
    },
  });
}

/** Placeholder hooks for future tax engines / bundles / coupons */
export function computeTaxes(breakdown: PricingBreakdown): number {
  return breakdown.taxCents;
}

export function computeFees(breakdown: PricingBreakdown): { serviceFeeCents: number; hostFeeCents: number } {
  return { serviceFeeCents: breakdown.serviceFeeCents, hostFeeCents: breakdown.hostFeeCents };
}
