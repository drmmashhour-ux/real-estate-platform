import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { BnhubMpProcessor, BnhubMpWebhookInboxStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Idempotency + audit for Stripe events (replay-safe marketplace layer).
 */
export async function recordStripeWebhookReceived(event: Stripe.Event): Promise<{
  isDuplicateProcessed: boolean;
}> {
  const existing = await prisma.bnhubProcessorWebhookInbox.findUnique({
    where: { eventId: event.id },
  });
  if (existing?.processingStatus === BnhubMpWebhookInboxStatus.PROCESSED) {
    return { isDuplicateProcessed: true };
  }
  await prisma.bnhubProcessorWebhookInbox.upsert({
    where: { eventId: event.id },
    create: {
      processor: BnhubMpProcessor.STRIPE,
      eventId: event.id,
      eventType: event.type,
      payloadJson: event as unknown as Prisma.InputJsonValue,
      processingStatus: BnhubMpWebhookInboxStatus.RECEIVED,
    },
    update: {
      eventType: event.type,
      payloadJson: event as unknown as Prisma.InputJsonValue,
    },
  });
  return { isDuplicateProcessed: false };
}

export async function markStripeWebhookProcessed(eventId: string, status: BnhubMpWebhookInboxStatus) {
  await prisma.bnhubProcessorWebhookInbox.updateMany({
    where: { eventId },
    data: { processingStatus: status },
  });
}
