const GUEST_FEE_PERCENT = 12;
const HOST_FEE_PERCENT = 3;

export interface PriceBreakdown {
  nights: number;
  totalCents: number;
  guestFeeCents: number;
  hostFeeCents: number;
  hostPayoutCents: number;
  guestTotalCents: number;
}

/**
 * Calculate booking price from nightly rate and number of nights.
 */
export function calculateBookingPrice(nightPriceCents: number, nights: number): PriceBreakdown {
  const totalCents = nightPriceCents * nights;
  const guestFeeCents = Math.round((totalCents * GUEST_FEE_PERCENT) / 100);
  const hostFeeCents = Math.round((totalCents * HOST_FEE_PERCENT) / 100);
  const hostPayoutCents = totalCents - hostFeeCents;
  const guestTotalCents = totalCents + guestFeeCents;
  return {
    nights,
    totalCents,
    guestFeeCents,
    hostFeeCents,
    hostPayoutCents,
    guestTotalCents,
  };
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
