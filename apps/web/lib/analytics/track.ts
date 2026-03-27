/**
 * Analytics & tracking — user behavior, conversions, booking metrics, revenue.
 * Wraps recordPlatformEvent with standard event shapes for consistent reporting.
 */

import { recordPlatformEvent } from "@/lib/observability";

export type TrackEvent =
  | { name: "signup"; userId: string; payload?: Record<string, unknown> }
  | { name: "login"; userId: string; payload?: Record<string, unknown> }
  | { name: "listing_view"; listingId: string; userId?: string | null; payload?: Record<string, unknown> }
  | { name: "search"; query: string; filters?: Record<string, unknown>; userId?: string | null; resultCount?: number }
  | { name: "booking_started"; listingId: string; userId: string; checkIn: string; checkOut: string }
  | { name: "booking_completed"; bookingId: string; listingId: string; userId: string; amountCents?: number }
  | { name: "payment_completed"; paymentId: string; userId: string; amountCents: number; paymentType: string }
  | { name: "deal_created"; dealId: string; userId: string; role: string }
  | { name: "offer_submitted"; transactionId: string; userId: string; offerPriceCents: number }
  | { name: "conversion"; type: string; entityId: string; userId?: string; valueCents?: number }
  | { name: "contract_signed"; contractId: string; userId?: string | null; contractType?: string }
  | { name: "listing_activated"; listingId: string; userId?: string | null; payload?: Record<string, unknown> }
  | { name: "commission_generated"; paymentId: string; userId?: string | null; amountCents?: number }
  | { name: "payment_received"; paymentId: string; userId?: string | null; amountCents?: number };

function getEntityId(event: TrackEvent): string {
  if ("listingId" in event && event.listingId) return event.listingId;
  if ("bookingId" in event && event.bookingId) return event.bookingId;
  if ("dealId" in event && event.dealId) return event.dealId;
  if ("contractId" in event && (event as { contractId?: string }).contractId) {
    return (event as { contractId: string }).contractId;
  }
  if ("userId" in event && event.userId) return event.userId;
  if ("paymentId" in event && (event as { paymentId: string }).paymentId) return (event as { paymentId: string }).paymentId;
  return "analytics";
}

export async function track(event: TrackEvent): Promise<void> {
  const eventType = event.name.toUpperCase().replace(/-/g, "_");
  const basePayload =
    "payload" in event && event.payload ? event.payload : {};
  const payload: Record<string, unknown> = { ...basePayload };
  if ("userId" in event && event.userId) payload.userId = event.userId;
  if ("listingId" in event) payload.listingId = (event as { listingId?: string }).listingId;
  if ("bookingId" in event) payload.bookingId = (event as { bookingId?: string }).bookingId;
  if ("dealId" in event) payload.dealId = (event as { dealId?: string }).dealId;
  if ("amountCents" in event && (event as { amountCents?: number }).amountCents != null) payload.amountCents = (event as { amountCents: number }).amountCents;
  if ("resultCount" in event && (event as { resultCount?: number }).resultCount != null) payload.resultCount = (event as { resultCount: number }).resultCount;
  await recordPlatformEvent({
    eventType,
    sourceModule: "analytics",
    entityType: "ANALYTICS",
    entityId: getEntityId(event),
    payload,
    region: undefined,
  });
}
