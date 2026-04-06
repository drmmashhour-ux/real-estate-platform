/**
 * Airbnb-style split (simplified): platform takes guest + host commission portions of the gross charge.
 * Amounts are integer minor units (cents).
 *
 * guestFee = 10% of amount (platform)
 * hostFee = 3% of amount (platform)
 * platformFee = guestFee + hostFee
 * hostAmount = amount - platformFee
 */
export type FeeBreakdown = {
  guestFeeCents: number;
  hostFeeCents: number;
  platformFeeCents: number;
  hostAmountCents: number;
};

const GUEST_RATE = 0.1;
const HOST_RATE = 0.03;

export function calculateFees(amountCents: number): FeeBreakdown {
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return { guestFeeCents: 0, hostFeeCents: 0, platformFeeCents: 0, hostAmountCents: 0 };
  }
  const guestFeeCents = Math.round(amountCents * GUEST_RATE);
  const hostFeeCents = Math.round(amountCents * HOST_RATE);
  const platformFeeCents = guestFeeCents + hostFeeCents;
  const hostAmountCents = Math.max(0, amountCents - platformFeeCents);
  return { guestFeeCents, hostFeeCents, platformFeeCents, hostAmountCents };
}
