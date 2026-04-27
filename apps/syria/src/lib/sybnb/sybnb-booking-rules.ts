import type { SyriaAppUser, SyriaBooking, SyriaProperty } from "@/generated/prisma";
import { sybnbConfig } from "@/config/sybnb.config";
import { hasSy8ListingStateAndCity } from "@/lib/sy8/sy8-feed-rank-compute";
import { computeSybnbQuote } from "@/lib/sybnb/sybnb-quote";

/**
 * Eligibility for a **new** stay booking request (guest) or host **confirm** on an existing request.
 * Never trust client-supplied price — amounts come only from `computeSybnbQuote` + Prisma.
 */

export type SybnbStayRequestBlockCode =
  | "not_stay"
  | "listing_not_approved"
  | "not_published"
  | "fraud_flag"
  | "needs_review"
  | "host_flagged"
  | "host_unverified"
  | "reports_threshold"
  | "supply_paused"
  | "location_incomplete";

/**
 * Hosts must be phone- or account-verified, and the account must be past a minimum age window
 * before they can enable **instant book** (when that product flag exists on listings).
 * New or unverified hosts are never eligible.
 */
export function hostMayEnableSybnbInstantBook(
  owner: Pick<SyriaAppUser, "phoneVerifiedAt" | "verifiedAt" | "createdAt">,
  now = new Date(),
): boolean {
  if (!sybnbConfig.instantBookEnabled) {
    return false;
  }
  const hasTrust = Boolean(owner.phoneVerifiedAt || owner.verifiedAt);
  if (!hasTrust) return false;
  const minAgeMs = sybnbConfig.minHostAccountAgeForInstantBookDays * 86400000;
  if (owner.createdAt.getTime() > now.getTime() - minAgeMs) {
    return false;
  }
  return true;
}

/**
 * All checks required before a short-stay listing may accept a new request or a host may confirm
 * a pending request (re-evaluate at confirm time; listing/host state can change).
 */
export function evaluateSybnbStayRequestEligibility(
  property: Pick<
    SyriaProperty,
    "category" | "type" | "sybnbReview" | "status" | "fraudFlag" | "needsReview" | "state" | "governorate" | "city"
  >,
  owner: Pick<SyriaAppUser, "flagged" | "sybnbSupplyPaused" | "phoneVerifiedAt" | "verifiedAt">,
  opts?: { unreviewedReportCount?: number },
): { ok: true } | { ok: false; code: SybnbStayRequestBlockCode } {
  if (property.category !== "stay" || property.type !== "RENT") {
    return { ok: false, code: "not_stay" };
  }
  if (!hasSy8ListingStateAndCity(property)) {
    return { ok: false, code: "location_incomplete" };
  }
  if (property.sybnbReview !== "APPROVED") {
    return { ok: false, code: "listing_not_approved" };
  }
  if (property.status !== "PUBLISHED") {
    return { ok: false, code: "not_published" };
  }
  if (property.fraudFlag) {
    return { ok: false, code: "fraud_flag" };
  }
  if (property.needsReview) {
    return { ok: false, code: "needs_review" };
  }
  if (owner.flagged) {
    return { ok: false, code: "host_flagged" };
  }
  if (sybnbConfig.requireHostVerifiedForStayRequests && !owner.phoneVerifiedAt && !owner.verifiedAt) {
    return { ok: false, code: "host_unverified" };
  }
  if (opts?.unreviewedReportCount != null) {
    if (opts.unreviewedReportCount >= sybnbConfig.maxUnreviewedReportsBlockBookings) {
      return { ok: false, code: "reports_threshold" };
    }
  }
  if (owner.sybnbSupplyPaused) {
    return { ok: false, code: "supply_paused" };
  }
  return { ok: true };
}

/**
 * Recompute stay totals from property + stay dates; must match the persisted `SyriaBooking` row.
 * Call before any payment side-effect or when validating webhook / PaymentIntent.
 */
export function sybnbBookingRowMatchesServerQuote(
  booking: Pick<
    SyriaBooking,
    "checkIn" | "checkOut" | "nightsCount" | "totalPrice" | "platformFeeAmount" | "hostNetAmount" | "nightlyRate"
  >,
  property: Pick<SyriaProperty, "pricePerNight" | "price" | "currency">,
): boolean {
  const q = computeSybnbQuote(property, booking.checkIn, booking.checkOut);
  if (q.nights !== booking.nightsCount) return false;
  if (booking.nightlyRate == null || booking.platformFeeAmount == null || booking.hostNetAmount == null) {
    return false;
  }
  if (!q.total.equals(booking.totalPrice)) return false;
  if (!q.nightly.equals(booking.nightlyRate)) return false;
  if (!q.platformFee.equals(booking.platformFeeAmount)) return false;
  if (!q.hostNet.equals(booking.hostNetAmount)) return false;
  return true;
}
