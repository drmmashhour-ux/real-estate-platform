/**
 * Placeholders for future email/SMS/in-app notifications.
 * Call from offer routes after successful mutations; no external dispatch in v1.
 */

export type OfferNotificationKind =
  | "offer_submitted"
  | "offer_countered"
  | "offer_accepted"
  | "offer_rejected";

export interface OfferNotificationPayload {
  offerId: string;
  listingId: string;
  /** Optional: buyer / broker user ids for routing */
  buyerId?: string;
  brokerId?: string | null;
  metadata?: Record<string, unknown>;
}

export function notifyOfferEvent(kind: OfferNotificationKind, payload: OfferNotificationPayload): void {
  if (process.env.NODE_ENV !== "production") {
    console.info("[offer-notifications]", kind, {
      offerId: payload.offerId,
      listingId: payload.listingId,
    });
  }
  // Future: enqueue job, insert Notification rows, send email via Resend, etc.
}
