import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;

/**
 * POST /api/closing/checkout
 * Body: { plan: "basic" | "pro" }
 * Tracks upgrade_started, returns Stripe Checkout URL (same billing as /api/billing/checkout).
 */
export async function POST(req: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan as string | undefined;
  if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
    return NextResponse.json({ error: "plan must be basic or pro" }, { status: 400 });
  }

  await trackGrowthFunnelEvent({
    userId,
    eventName: "upgrade_started",
    properties: { source: "closing_checkout", plan },
  });

  const planConfig = plans[plan as PlanKey];
  const amountCents = Math.round(planConfig.price * 100);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || req.headers.get("origin") || getPublicAppUrl();
  const successUrl = `${baseUrl}/dashboard/storage?upgrade=success&plan=${encodeURIComponent(plan)}&closing=1`;
  const cancelUrl = `${baseUrl}/dashboard/storage?upgrade=cancelled`;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `LECIPM upgrade: ${planConfig.label}`,
            description: `${planConfig.storageLabel} storage + unlimited simulations & AI drafting`,
            images: [],
          },
        },
      },
    ],
    metadata: {
      userId,
      plan,
      source: "closing",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const url = session.url;
  if (!url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url });
}
