import type Stripe from "stripe";

export const HOST_ACCOUNT_NOT_READY = "HOST_ACCOUNT_NOT_READY" as const;
export const HOST_ACCOUNT_INCOMPLETE = "HOST_ACCOUNT_INCOMPLETE" as const;

export type HostReadinessErrorCode = typeof HOST_ACCOUNT_NOT_READY | typeof HOST_ACCOUNT_INCOMPLETE;

export class HostNotReadyToReceivePaymentsError extends Error {
  override readonly name = "HostNotReadyToReceivePaymentsError";
  constructor(readonly code: HostReadinessErrorCode) {
    super(code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isFalseish(v: boolean | null | undefined): boolean {
  return v !== true;
}

/**
 * Order 65 — Block Checkout when the Connect account cannot accept charges or payouts, or
 * has outstanding `requirements.currently_due` (avoids failed Stripe payment attempts).
 */
export async function assertHostReady(stripe: Stripe, stripeAccountId: string): Promise<void> {
  const acct = await stripe.accounts.retrieve(stripeAccountId);

  if (isFalseish(acct.charges_enabled) || isFalseish(acct.payouts_enabled)) {
    throw new HostNotReadyToReceivePaymentsError(HOST_ACCOUNT_NOT_READY);
  }
  if (acct.requirements?.currently_due && acct.requirements.currently_due.length > 0) {
    throw new HostNotReadyToReceivePaymentsError(HOST_ACCOUNT_INCOMPLETE);
  }
}

export function isHostNotReadyToReceivePaymentsError(
  e: unknown
): e is HostNotReadyToReceivePaymentsError {
  return e instanceof HostNotReadyToReceivePaymentsError;
}
