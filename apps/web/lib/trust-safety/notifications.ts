/**
 * Trust & Safety notifications.
 * Trigger points for: listing frozen, investigation opened, complaint submitted,
 * host response requested, payout on hold, refund decision, listing suspended, relocation.
 * Implement in-app and email hooks as needed.
 */

export type TrustSafetyEvent =
  | "listing_frozen"
  | "fraud_investigation_opened"
  | "complaint_submitted"
  | "host_response_requested"
  | "payout_on_hold"
  | "refund_decision"
  | "listing_suspended"
  | "guest_relocation_started"
  | "dispute_escalated";

export interface NotifyPayload {
  event: TrustSafetyEvent;
  listingId?: string;
  bookingId?: string;
  disputeId?: string;
  userId?: string;
  hostId?: string;
  guestId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/** Emit trust & safety event. Wire to in-app notifications, email, support alerts. */
export async function notifyTrustSafety(payload: NotifyPayload): Promise<void> {
  // TODO: push to in-app notification queue, send email, alert support dashboard
  if (process.env.NODE_ENV === "development") {
    console.log("[TrustSafety]", payload.event, payload);
  }
}
