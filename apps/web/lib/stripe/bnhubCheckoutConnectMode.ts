/**
 * When true: BNHUB booking Checkout omits Stripe Connect (see POST /api/stripe/checkout).
 * The public listing page treats the host as payout-eligible so guests can use Request to book.
 * Keep in sync with booking checkout behavior before flipping to production Connect flows.
 */
export const BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT = true;
