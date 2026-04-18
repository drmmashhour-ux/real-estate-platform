/**
 * Stripe payment safety — verification helpers and trust model for LECIPM Production Launch.
 * Primary webhook remains `app/api/stripe/webhook/route.ts` (signature + business logic).
 */
import type Stripe from "stripe";
import { BnhubMpWebhookInboxStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { constructStripeWebhookEvent } from "@/modules/stripe/webhook.service";

export { constructStripeWebhookEvent };

/** Webhook signing secret must be Stripe Dashboard / CLI `whsec_` format. */
export function assertWebhookSecretFormat(secret: string | undefined, isProdRuntime: boolean): string | null {
  if (!secret?.trim()) {
    return isProdRuntime ? "Webhook misconfigured" : "STRIPE_WEBHOOK_SECRET missing";
  }
  if (!secret.startsWith("whsec_")) {
    return isProdRuntime ? "Webhook misconfigured" : "STRIPE_WEBHOOK_SECRET must start with whsec_";
  }
  return null;
}

const PAYMENT_AUDIT_EVENT_TYPES = new Set<string>([
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
  "invoice.paid",
]);

/**
 * After `constructEvent` succeeds — durable audit for payment-adjacent events only (avoids flooding).
 */
export async function auditStripePaymentEventIfApplicable(event: Stripe.Event): Promise<void> {
  if (!PAYMENT_AUDIT_EVENT_TYPES.has(event.type)) return;
  await recordAuditEvent({
    action: "stripe_payment_event_verified",
    payload: { eventType: event.type, eventId: event.id },
  });
}

/**
 * BNHub processor inbox idempotency — duplicate PROCESSED events must not double-apply business effects.
 * @see recordStripeWebhookReceived in bnhub-payments infrastructure
 */
export async function isStripeEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const row = await prisma.bnhubProcessorWebhookInbox.findUnique({
    where: { eventId },
    select: { processingStatus: true },
  });
  return row?.processingStatus === BnhubMpWebhookInboxStatus.PROCESSED;
}

/**
 * Trust rules (documentation + runtime checks callers should respect):
 * - Never trust `success_url` or client callbacks alone for entitlements.
 * - Booking/reservation confirmation flows must align DB state with webhook + guards (e.g. assertBookingStripeWebhookValid).
 */
export const STRIPE_PAYMENT_TRUST_MODEL = {
  checkoutSourceOfTruth: "Stripe Checkout Session + webhook constructEvent",
  bookingConfirmation: "Server webhook handler + assertBookingStripeWebhookValid / payment service",
  idempotency: "bnhubProcessorWebhookInbox.eventId + processingStatus",
} as const;
