/**
 * Stripe webhook idempotency gate — duplicate PROCESSED events must not re-run fulfillment.
 * Primary handler: `app/api/stripe/webhook/route.ts` (signature + business logic).
 *
 * @see recordStripeWebhookReceived — `bnhubProcessorWebhookInbox.eventId`
 */
import type Stripe from "stripe";
import { recordStripeWebhookReceived } from "@/modules/bnhub-payments/infrastructure/stripeWebhookInbox";

export type StripeWebhookProcessingGate = "process" | "skip_duplicate";

/**
 * Records receipt and returns whether this event id was already fully processed.
 * Call immediately after `constructEvent` succeeds.
 */
export async function gateStripeWebhookProcessing(event: Stripe.Event): Promise<StripeWebhookProcessingGate> {
  const { isDuplicateProcessed } = await recordStripeWebhookReceived(event);
  return isDuplicateProcessed ? "skip_duplicate" : "process";
}
