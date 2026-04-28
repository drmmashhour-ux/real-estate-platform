/**
 * Guards for Stripe Checkout–only monetization rails (additive; no PAN handling).
 */

import { NextResponse } from "next/server";

import type { PaymentRailsBlockReason } from "./flags";
import { getCheckoutRailsBlockReason, getIngressProductionLockReason } from "./flags";

export const PAYMENT_RAILS_MESSAGES: Record<PaymentRailsBlockReason, string> = {
  production_lock_disabled:
    "PRODUCTION_LOCK_MODE must be true before payment routes accept traffic.",
  payments_disabled:
    "PAYMENTS_ENABLED is false — enable only after compliance sign-off.",
};

/** Checkout creators, redirects to Stripe Hosted Checkout, Connect onboarding, billing-portal POST, etc. */
export function checkoutRailsRejectResponse(reason: PaymentRailsBlockReason): NextResponse {
  return NextResponse.json(
    {
      error: "payments_unavailable",
      code: reason,
      message: PAYMENT_RAILS_MESSAGES[reason],
    },
    { status: 503 },
  );
}

/** Returns HTTP response only when gated; otherwise `null` and route should continue. */
export function requireCheckoutRailsOpen(): NextResponse | null {
  const reason = getCheckoutRailsBlockReason();
  if (!reason) return null;
  return checkoutRailsRejectResponse(reason);
}

/** Webhooks that confirm paid state must still pass the production lock latch. */
export function requireProductionLockForPaymentIngress(): NextResponse | null {
  const reason = getIngressProductionLockReason();
  if (!reason) return null;
  return checkoutRailsRejectResponse(reason);
}
