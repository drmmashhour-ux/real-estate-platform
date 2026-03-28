import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";

function extractBookingAndPi(event: Stripe.Event): {
  bookingId: string | null;
  paymentIntentId: string | null;
  metadata: Record<string, unknown>;
} {
  const obj = event.data.object as unknown as Record<string, unknown>;
  let bookingId: string | null = null;
  let paymentIntentId: string | null = null;
  const metadata: Record<string, unknown> = {
    stripeEventType: event.type,
    objectId: typeof obj.id === "string" ? obj.id : null,
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    bookingId = (session.metadata?.bookingId as string | undefined) ?? null;
    const pi = session.payment_intent;
    paymentIntentId = typeof pi === "string" ? pi : pi && typeof pi === "object" && "id" in pi ? String((pi as { id: string }).id) : null;
    if (session.metadata && typeof session.metadata === "object") {
      Object.assign(metadata, session.metadata as object);
    }
  } else if (event.type.startsWith("payment_intent.")) {
    const pi = event.data.object as Stripe.PaymentIntent;
    paymentIntentId = pi.id;
    if (pi.metadata && typeof pi.metadata === "object") {
      bookingId = (pi.metadata.bookingId as string | undefined) ?? null;
      Object.assign(metadata, pi.metadata as object);
    }
  }

  return { bookingId, paymentIntentId, metadata };
}

/**
 * Idempotent growth observability: `stripe_events` dedupe + `growth_stripe_webhook_logs` + `user_events`.
 */
export async function captureStripeEventForGrowthEngine(event: Stripe.Event): Promise<void> {
  try {
    await prisma.stripeWebhookEventDedupe.create({
      data: { eventId: event.id },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : undefined;
    if (code === "P2002") return;
    logError("growth stripe dedupe insert failed", e);
    return;
  }

  const { bookingId, paymentIntentId, metadata } = extractBookingAndPi(event);

  try {
    await prisma.growthStripeWebhookLog.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        metadata: metadata as object,
        bookingId,
        paymentIntentId,
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : undefined;
    if (code !== "P2002") logError("growth stripe webhook log failed", e);
  }

  try {
    await prisma.userEvent.create({
      data: {
        eventType: "STRIPE_WEBHOOK",
        metadata: {
          eventId: event.id,
          eventType: event.type,
          bookingId,
          paymentIntentId,
          ...metadata,
        } as object,
      },
    });
  } catch (e) {
    logError("growth user_event stripe_webhook failed", e);
  }
}
