import { NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import { requireProductionLockForPaymentIngress } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;

/**
 * POST /api/billing/webhook
 * Stripe webhook: on checkout.session.completed, upgrade storage and create invoice.
 * Requires STRIPE_WEBHOOK_SECRET. Body must be raw (consumed as text) for signature verification.
 */
export async function POST(request: NextRequest) {
  const ingress = requireProductionLockForPaymentIngress();
  if (ingress) return ingress;

  if (!isStripeConfigured()) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook secret not set" }, { status: 500 });
  }

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as string | undefined;

  if (!userId || !plan || !VALID_PLANS.includes(plan as PlanKey)) {
    console.error("Webhook missing userId or plan in metadata", { userId, plan });
    return Response.json({ error: "Invalid metadata" }, { status: 400 });
  }

  // Idempotency: avoid duplicate upgrade/invoice if webhook is retried
  const stripePaymentId = session.id;
  const existing = await prisma.upgradeInvoice.findUnique({
    where: { stripePaymentId },
  });
  if (existing) {
    return Response.json({ received: true, duplicate: true });
  }

  const planConfig = plans[plan as PlanKey];
  const limitBytes = planConfig.storage;
  const amount = planConfig.price;

  await prisma.userStorage.upsert({
    where: { userId },
    create: {
      userId,
      usedBytes: 0,
      limitBytes,
    },
    update: { limitBytes },
  });

  await prisma.user.updateMany({
    where: { id: userId },
    data: { plan },
  });

  await prisma.upgradeInvoice.create({
    data: {
      userId,
      amount,
      plan,
      stripePaymentId,
    },
  });

  void trackGrowthFunnelEvent({
    userId,
    eventName: "upgrade_completed",
    properties: { plan, stripeSessionId: stripePaymentId, source: "billing_webhook" },
  });

  return Response.json({ received: true, upgraded: true });
}
