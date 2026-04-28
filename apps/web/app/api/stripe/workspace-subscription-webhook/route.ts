import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { logError } from "@/lib/logger";
import { syncSubscriptionFromWebhook } from "@/modules/billing/syncSubscriptionFromWebhook";
import { requireProductionLockForPaymentIngress } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * POST /api/stripe/workspace-subscription-webhook
 *
 * Dedicated endpoint for LECIPM workspace billing only (optional). The main
 * `/api/stripe/webhook` already calls `syncSubscriptionFromWebhook` for the same events.
 *
 * Configure a separate Stripe webhook URL only if you want isolation; otherwise use the
 * primary webhook and do not register this URL in Stripe (avoids duplicate processing).
 */
export async function POST(req: Request) {
  const ingress = requireProductionLockForPaymentIngress();
  if (ingress) return ingress;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret?.startsWith("whsec_")) {
    return NextResponse.json(
      { error: "Webhook not configured. Set STRIPE_WEBHOOK_SECRET (whsec_…)." },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured. Set STRIPE_SECRET_KEY." }, { status: 503 });
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    logError("Workspace subscription webhook: signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const existing = await prisma.billingEvent.findUnique({
      where: { stripeEventId: event.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await syncSubscriptionFromWebhook({ event, prisma, stripe });
    return NextResponse.json({ received: true });
  } catch (error) {
    logError("Workspace subscription webhook: processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
