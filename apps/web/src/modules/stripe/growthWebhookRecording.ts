import type Stripe from "stripe";
import { Prisma, UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

function extractBookingAndPaymentIntent(event: Stripe.Event): { bookingId: string | null; paymentIntentId: string | null } {
  const obj = event.data.object as Record<string, unknown>;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : null;
    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? (session.payment_intent as Stripe.PaymentIntent).id
          : null;
    return { bookingId, paymentIntentId: pi };
  }
  if (event.type.startsWith("payment_intent.")) {
    const pi = obj as unknown as Stripe.PaymentIntent;
    const bookingId =
      typeof pi.metadata?.bookingId === "string"
        ? pi.metadata.bookingId
        : typeof pi.metadata?.booking_id === "string"
          ? pi.metadata.booking_id
          : null;
    return { bookingId, paymentIntentId: pi.id };
  }
  return { bookingId: null, paymentIntentId: null };
}

/**
 * Idempotent growth observability: one `growth_stripe_webhook_logs` row per `event.id`,
 * plus mirrored `user_events` row when insert succeeds.
 */
export async function recordGrowthStripeWebhookObservability(event: Stripe.Event): Promise<"inserted" | "duplicate"> {
  const { bookingId, paymentIntentId } = extractBookingAndPaymentIntent(event);
  const metadata: Prisma.InputJsonValue = {
    stripe_event_id: event.id,
    type: event.type,
    livemode: event.livemode,
    booking_id: bookingId,
    payment_intent_id: paymentIntentId,
  };

  try {
    await prisma.growthStripeWebhookLog.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        metadata,
        bookingId,
        paymentIntentId,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return "duplicate";
    }
    throw e;
  }

  await prisma.userEvent.create({
    data: {
      eventType: UserEventType.STRIPE_WEBHOOK,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  return "inserted";
}
