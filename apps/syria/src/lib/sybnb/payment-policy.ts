import type { SyriaAppUser, SyriaBooking, SyriaProperty } from "@/generated/prisma";
import { sybnbConfig, type SybnbPaymentProvider } from "@/config/sybnb.config";

export type SybnbCheckoutBlockReason =
  | "payments_disabled"
  | "provider_not_stripe"
  | "host_not_verified"
  | "listing_not_approved"
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
  if (!listingAllowedForSybnbPayment(property)) {
    return { ok: false, reason: "listing_not_approved", detail: "Stay listing is not operator-approved" };
  }
  if (booking.status !== "CONFIRMED") {
    return { ok: false, reason: "booking_not_confirmed", detail: "Booking must be host/admin confirmed" };
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
