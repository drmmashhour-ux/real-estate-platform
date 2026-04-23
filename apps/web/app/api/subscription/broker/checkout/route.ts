import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import {
  resolveBrokerCheckoutPriceId,
} from "@/modules/billing/brokerLecipmSubscription";
import { LECIPM_BROKER_SUBSCRIPTION_CHECKOUT } from "@/modules/billing/constants";
import type { BrokerPlanSlug } from "@/modules/subscription/domain/brokerPlans";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscription/broker/checkout — Stripe subscription for Pro / Platinum broker plans.
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Broker access required" }, { status: 403 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "Email required on account" }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const planRaw = typeof body.plan === "string" ? body.plan.toLowerCase() : "";
  const plan: BrokerPlanSlug = planRaw === "platinum" ? "platinum" : "pro";
  const priceId = resolveBrokerCheckoutPriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe price env (set STRIPE_PRICE_LECIPM_BROKER_PRO and STRIPE_PRICE_LECIPM_BROKER_PLATINUM)",
      },
      { status: 503 }
    );
  }

  const base = getSiteBaseUrl();
  const successUrl = `${base}/dashboard/broker?sub=success`;
  const cancelUrl = `${base}/dashboard/broker?sub=cancel`;

  try {
    await prisma.trafficEvent
      .create({
        data: {
          eventType: "subscription_checkout_started",
          path: "/dashboard/broker",
          source: "broker_subscription",
          medium: "product",
          meta: { userId, plan } as object,
        },
      })
      .catch(() => {});

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        paymentType: LECIPM_BROKER_SUBSCRIPTION_CHECKOUT,
        lecipmBrokerPlan: plan,
      },
      subscription_data: {
        metadata: {
          userId,
          paymentType: LECIPM_BROKER_SUBSCRIPTION_CHECKOUT,
          lecipmBrokerPlan: plan,
        },
      },
    });

    const url = session.url;
    if (!url) return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    return NextResponse.json({ url, sessionId: session.id, plan });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
