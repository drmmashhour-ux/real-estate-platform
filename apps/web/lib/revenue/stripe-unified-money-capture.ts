/**
 * Lightweight revenue audit rows keyed by stable Stripe payment identifiers (hosted Checkout flows).
 */

import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";

const ENTITY_CAPTURE = "stripe_money_capture";

function inferBusinessSource(metadata: Stripe.Metadata | null | undefined): string {
  const md = (metadata ?? {}) as Record<string, string | undefined>;
  const bookingId = md.bookingId ?? md.booking_id;
  const pt = `${md.paymentType ?? md.payment_type ?? ""}`.toLowerCase();
  if (bookingId || pt.includes("bnhub")) return "bnhub";
  if (md.listingId || pt.includes("listing")) return "listings";
  if (pt.includes("broker") || pt.includes("lead")) return "broker_billing";
  if (pt.includes("subscription") || pt.includes("sub")) return "subscription";
  if (pt.includes("featured")) return "featured";
  return "other";
}

function stableCorrelationFromPaymentIntent(pi: Stripe.PaymentIntent): string {
  return `pi:${pi.id}`;
}

function stableCorrelationFromCheckout(session: Stripe.Checkout.Session): string | null {
  const piEmbedded = session.payment_intent;
  const piId =
    typeof piEmbedded === "string"
      ? piEmbedded
      : piEmbedded && typeof piEmbedded === "object" && "id" in piEmbedded
        ? String((piEmbedded as Stripe.PaymentIntent).id)
        : null;
  if (typeof piId === "string" && piId.startsWith("pi_")) return `pi:${piId}`;
  if (typeof session.id === "string" && session.id.startsWith("cs_")) return `cs:${session.id}`;
  return null;
}

export async function recordUnifiedStripeCaptureFromCheckoutSessionPaid(opts: {
  prisma: PrismaClient;
  session: Stripe.Checkout.Session;
}): Promise<void> {
  const { prisma, session } = opts;
  if (typeof session.amount_total !== "number" || session.amount_total <= 0) return;
  const corr = stableCorrelationFromCheckout(session);
  if (!corr) return;
  const existing = await prisma.platformRevenueEvent.findFirst({
    where: {
      entityType: ENTITY_CAPTURE,
      entityId: corr,
    },
  });
  if (existing) return;
  await prisma.platformRevenueEvent.create({
    data: {
      entityType: ENTITY_CAPTURE,
      entityId: corr,
      revenueType: `stripe_capture_${inferBusinessSource(session.metadata ?? {})}`,
      amountCents: session.amount_total,
      currency: (session.currency ?? "cad").toUpperCase(),
      status: "realized",
      sourceReference: session.id.slice(0, 255),
    },
  });
}

export async function recordUnifiedStripeCaptureFromPaymentIntent(opts: {
  prisma: PrismaClient;
  pi: Stripe.PaymentIntent;
}): Promise<void> {
  const { prisma, pi } = opts;
  const amount = typeof pi.amount_received === "number" ? pi.amount_received : pi.amount;
  if (typeof amount !== "number" || amount <= 0) return;
  const corr = stableCorrelationFromPaymentIntent(pi);
  const existing = await prisma.platformRevenueEvent.findFirst({
    where: {
      entityType: ENTITY_CAPTURE,
      entityId: corr,
    },
  });
  if (existing) return;
  await prisma.platformRevenueEvent.create({
    data: {
      entityType: ENTITY_CAPTURE,
      entityId: corr,
      revenueType: `stripe_capture_${inferBusinessSource(pi.metadata ?? {})}`,
      amountCents: amount,
      currency: (pi.currency ?? "cad").toUpperCase(),
      status: "realized",
      sourceReference: pi.id.slice(0, 255),
    },
  });
}
