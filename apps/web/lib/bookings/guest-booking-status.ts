/**
 * Guest Supabase `bookings.status` lifecycle (BNHub mobile).
 * `paid` is set only by Stripe webhook. `processing` = checkout session created.
 */

export type GuestSupabaseBookingLifecycleStatus =
  | "pending"
  | "processing"
  | "paid"
  | "canceled"
  | "completed";

export function normalizeGuestBookingStatus(raw: string | null | undefined): string {
  return (raw ?? "pending").trim().toLowerCase();
}

/** Blocks nights for availability (everything except canceled). */
export function statusBlocksListingNights(status: string): boolean {
  const s = normalizeGuestBookingStatus(status);
  return s !== "canceled" && s !== "cancelled";
}

/** User cannot start another checkout. */
export function isGuestBookingPaidOrCompleted(status: string): boolean {
  const s = normalizeGuestBookingStatus(status);
  return s === "paid" || s === "completed";
}

export function isGuestBookingCanceled(status: string): boolean {
  const s = normalizeGuestBookingStatus(status);
  return s === "canceled" || s === "cancelled";
}

/** Eligible to create / replace a Stripe Checkout session (server-side). */
export function canGuestBookingStartCheckout(status: string): boolean {
  const s = normalizeGuestBookingStatus(status);
  return s === "pending" || s === "processing";
}
