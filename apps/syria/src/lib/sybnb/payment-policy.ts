import type { SyriaAppUser, SyriaBooking, SyriaProperty } from "@/generated/prisma";
import { sybnbConfig, type SybnbPaymentProvider } from "@/config/sybnb.config";
import { sybnbBookingRowMatchesServerQuote } from "@/lib/sybnb/sybnb-booking-rules";

export type SybnbCheckoutBlockReason =
  | "payments_disabled"
  | "provider_not_stripe"
  | "host_not_verified"
  | "listing_not_approved"
  | "listing_needs_review"
  | "host_flagged"
  | "amount_integrity_failed"
  | "booking_not_approved_for_payment"
  | "guest_payment_not_unpaid"
  | "booking_not_confirmed"
  | "compliance_failed"
  | "not_guest";

export function complianceCheckPassedForSybnbPayment(userId: string): boolean {
  if (sybnbConfig.complianceMode === "relaxed") return true;
  return sybnbConfig.complianceMock === "pass" && userId.length > 0;
}

function hostIsSybnbVerifiedForPayments(owner: SyriaAppUser): boolean {
  if (owner.phoneVerifiedAt) return true;
  if (owner.verifiedAt) return true;
  return false;
}

function listingAllowedForSybnbPayment(property: SyriaProperty): boolean {
  if (property.category !== "stay") return false;
  if (property.sybnbReview !== "APPROVED") return false;
  if (property.status !== "PUBLISHED" || property.fraudFlag) return false;
  return true;
}

export function assertSybnbStripePreconditions(
  property: SyriaProperty,
  owner: SyriaAppUser,
  booking: SyriaBooking,
  guestId: string,
): { ok: true } | { ok: false; reason: SybnbCheckoutBlockReason; detail: string } {
  if (!sybnbConfig.paymentsEnabled) {
    return { ok: false, reason: "payments_disabled", detail: "SYBNB_PAYMENTS_ENABLED is not true" };
  }
  if (sybnbConfig.provider !== "stripe") {
    return { ok: false, reason: "provider_not_stripe", detail: `Provider is ${sybnbConfig.provider}` };
  }
  if (!hostIsSybnbVerifiedForPayments(owner)) {
    return { ok: false, reason: "host_not_verified", detail: "Host has no phone or account verification" };
  }
  if (owner.flagged) {
    return { ok: false, reason: "host_flagged", detail: "Host account is flagged; card checkout blocked" };
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
  /// Card payment runs **after** host approval (`APPROVED`) and before final confirmation (`CONFIRMED`) via webhook.
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

/** Whether UI may show a “Pay with card” surface (still calls assert before any Stripe API). */
export function isSybnbCardCheckoutUiEnabled(provider: SybnbPaymentProvider): boolean {
  return sybnbConfig.paymentsEnabled && provider === "stripe";
}
