import type {
  SyriaBookingPaymentStatus,
  SyriaBookingStatus,
  SyriaListingPaymentStatus,
  SyriaPropertyStatus,
  SyriaPayoutLedgerStatus,
} from "@/generated/prisma";

/** UI labels — map DB enums to product language keys (caller translates). */
export function listingStatusTone(s: SyriaPropertyStatus): "neutral" | "warn" | "ok" | "bad" | "muted" {
  switch (s) {
    case "PUBLISHED":
      return "ok";
    case "PENDING_REVIEW":
      return "warn";
    case "DRAFT":
      return "muted";
    case "REJECTED":
    case "ARCHIVED":
      return "bad";
    default:
      return "neutral";
  }
}

export function bookingLifecycleLabel(
  row: {
    status: SyriaBookingStatus;
    guestPaymentStatus: SyriaBookingPaymentStatus;
    checkedInAt: Date | null;
    checkOut: Date;
  },
): "pending" | "pending_payment" | "confirmed" | "checked_in" | "completed" | "cancelled" {
  if (row.status === "CANCELLED") return "cancelled";
  if (row.checkedInAt) {
    const now = Date.now();
    if (now >= row.checkOut.getTime()) return "completed";
    return "checked_in";
  }
  if (row.status === "CONFIRMED") return "confirmed";
  if (row.guestPaymentStatus === "UNPAID" || row.guestPaymentStatus === "PENDING_MANUAL") {
    return "pending_payment";
  }
  return "pending";
}

export function payoutTone(s: SyriaPayoutLedgerStatus): "warn" | "ok" | "muted" | "bad" {
  switch (s) {
    case "PAID":
      return "ok";
    case "APPROVED":
      return "muted";
    case "PENDING":
      return "warn";
    default:
      return "muted";
  }
}

export function listingPaymentTone(s: SyriaListingPaymentStatus): "warn" | "ok" | "bad" {
  switch (s) {
    case "VERIFIED":
      return "ok";
    case "FAILED":
      return "bad";
    default:
      return "warn";
  }
}
