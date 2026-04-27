import type { SyriaAppUser, SyriaBooking, SyriaProperty } from "@/generated/prisma";
import {
  PRODUCTION_LOCK_MODE,
  SYBNB_PAYMENTS_KILL_SWITCH,
  sybnbConfig,
  type SybnbPaymentProvider,
} from "@/config/sybnb.config";
import { sybnbBookingRowMatchesServerQuote } from "@/lib/sybnb/sybnb-booking-rules";
import { evaluateSybnbPaymentRisk } from "@/lib/sybnb/sybnb-payment-risk";

export type SybnbCheckoutBlockReason =
  | "payments_disabled"
  | "provider_not_stripe"
  | "listing_not_approved"
  | "listing_needs_review"
  | "amount_integrity_failed"
  | "booking_not_approved_for_payment"
  | "guest_payment_not_unpaid"
  | "compliance_failed"
  | "not_guest"
  | "sybnb_risk_block"
  | "payment_requires_risk_review"
  | "production_lock_payments"
  | "demo_mode_payment_blocked"
  | "payments_kill_switch";

export function complianceCheckPassedForSybnbPayment(userId: string): boolean {
  if (sybnbConfig.complianceMode === "relaxed") return true;
  return sybnbConfig.complianceMock === "pass" && userId.length > 0;
}

function listingAllowedForSybnbPayment(property: SyriaProperty): boolean {
  if (property.category !== "stay") return false;
  if (property.sybnbReview !== "APPROVED") return false;
  if (property.status !== "PUBLISHED" || property.fraudFlag) return false;
  return true;
}

/**
 * Server-only gates for stub/live PaymentIntent: **not** the full policy — call
 * `assertSybnbPaymentCompleteAsync` for seller/listing risk (block, review) before any charge.
 */
export function assertSybnbStripeBasePreconditions(
  property: SyriaProperty,
  _owner: SyriaAppUser,
  booking: SyriaBooking,
  guestId: string,
):
  | { ok: true }
  | { ok: false; reason: SybnbCheckoutBlockReason; detail: string } {
  if (process.env.INVESTOR_DEMO_MODE === "true") {
    return {
      ok: false,
      reason: "demo_mode_payment_blocked",
      detail: "DEMO_MODE_PAYMENT_BLOCKED — investor demo: no real card charges",
    };
  }
  if (PRODUCTION_LOCK_MODE) {
    return {
      ok: false,
      reason: "production_lock_payments",
      detail: "Payments are disabled in production lock mode",
    };
  }
  if (!sybnbConfig.paymentsEnabled) {
    return { ok: false, reason: "payments_disabled", detail: "SYBNB_PAYMENTS_ENABLED is not true" };
  }
  if (sybnbConfig.provider !== "stripe") {
    return { ok: false, reason: "provider_not_stripe", detail: `Provider is ${sybnbConfig.provider}` };
  }
  if (property.needsReview) {
    return {
      ok: false,
      reason: "listing_needs_review",
      detail: "Listing is queued for review; cannot take payment",
    };
  }
  if (!listingAllowedForSybnbPayment(property)) {
    return { ok: false, reason: "listing_not_approved", detail: "Stay listing is not operator-approved" };
  }
  if (!sybnbBookingRowMatchesServerQuote(booking, property)) {
    return {
      ok: false,
      reason: "amount_integrity_failed",
      detail: "Booking amounts do not match server recalculation — do not charge",
    };
  }
  if (booking.status !== "APPROVED") {
    return {
      ok: false,
      reason: "booking_not_approved_for_payment",
      detail: "Host must approve the request before payment",
    };
  }
  if (booking.guestPaymentStatus !== "UNPAID") {
    return {
      ok: false,
      reason: "guest_payment_not_unpaid",
      detail: "Payment already recorded or manual path",
    };
  }
  if (booking.guestId !== guestId) {
    return { ok: false, reason: "not_guest", detail: "Not the guest for this booking" };
  }
  if (!complianceCheckPassedForSybnbPayment(guestId)) {
    return { ok: false, reason: "compliance_failed", detail: "Compliance / sanctions check did not pass" };
  }
  return { ok: true };
}

export type SybnbPaymentGateResult =
  | { ok: true }
  | { ok: false; reason: SybnbCheckoutBlockReason; detail: string; riskCodes?: string[] };

/**
 * Full pre-charge check: base technical gates + `evaluateSybnbPaymentRisk` (block & review).
 * **Review** returns `ok: false` with `payment_requires_risk_review` (no auto-capture).
 */
export async function assertSybnbPaymentCompleteAsync(
  property: SyriaProperty,
  owner: SyriaAppUser,
  booking: SyriaBooking,
  guestId: string,
): Promise<SybnbPaymentGateResult> {
  const base = assertSybnbStripeBasePreconditions(property, owner, booking, guestId);
  if (!base.ok) {
    return base;
  }
  const risk = await evaluateSybnbPaymentRisk({ booking, property, owner });
  if (risk.level === "block") {
    return { ok: false, reason: "sybnb_risk_block", detail: risk.detail, riskCodes: risk.codes };
  }
  if (risk.level === "review") {
    return {
      ok: false,
      reason: "payment_requires_risk_review",
      detail: risk.detail,
      riskCodes: risk.codes,
    };
  }
  return { ok: true };
}

/** @deprecated — use `assertSybnbStripeBasePreconditions` or `assertSybnbPaymentCompleteAsync` */
export function assertSybnbStripePreconditions(
  property: SyriaProperty,
  owner: SyriaAppUser,
  booking: SyriaBooking,
  guestId: string,
) {
  return assertSybnbStripeBasePreconditions(property, owner, booking, guestId);
}

/** Whether UI may show a “Pay with card” surface (still calls assert before any Stripe API). */
export function isSybnbCardCheckoutUiEnabled(provider: SybnbPaymentProvider): boolean {
  return sybnbConfig.paymentsEnabled && !SYBNB_PAYMENTS_KILL_SWITCH && provider === "stripe";
}
