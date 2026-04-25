/**
 * Commission math for marketplace — pure helpers (cents where noted).
 * Default short-term platform take: 1.5% of booking subtotal (under 2% cap in product spec).
 */
export const DEFAULT_SHORT_TERM_PLATFORM_RATE = 0.015;

export function shortTermPlatformCommissionCents(bookingSubtotalCents: number, rate = DEFAULT_SHORT_TERM_PLATFORM_RATE): number {
  if (!Number.isFinite(bookingSubtotalCents) || bookingSubtotalCents <= 0) return 0;
  return Math.round(bookingSubtotalCents * rate);
}

/** Long-term rent: commission = one month rent (amounts in same currency units). */
export function longTermRentCommissionFromMonthlyRent(rentAmount: number): number {
  if (!Number.isFinite(rentAmount) || rentAmount <= 0) return 0;
  return rentAmount;
}

export function netToHostAfterPlatformCents(params: {
  subtotalCents: number;
  platformCommissionCents: number;
  hostFeeCents: number;
}): number {
  const n = params.subtotalCents - params.platformCommissionCents - params.hostFeeCents;
  return Math.max(0, Math.round(n));
}
