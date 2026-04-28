import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;

/**
 * POST /api/billing/checkout
 * Body: { plan: "basic" | "pro" }
 * Creates a Stripe Checkout Session and returns { url } to redirect the user to secure payment.
 */
export async function POST(request: NextRequest) {
  try {
    const railBlock = requireCheckoutRailsOpen();
    if (railBlock) return railBlock;

    if (!isStripeConfigured()) {
      return Response.json(
        { error: "Payments are not configured" },
        { status: 503 }
      );
    }

    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as string | undefined;
    if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
      return Response.json(
        { error: "plan must be basic, pro, or platinum" },
        { status: 400 }
      );
    }

    const planConfig = plans[plan as PlanKey];
    const amountCents = Math.round(planConfig.price * 100);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl?.origin || getPublicAppUrl();
    const successUrl = `${baseUrl}/dashboard/storage?upgrade=success&plan=${encodeURIComponent(plan)}`;
    const cancelUrl = `${baseUrl}/dashboard/storage?upgrade=cancelled`;

    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Payments are not configured" },
        { status: 503 }
      );
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
              name: `Storage upgrade: ${planConfig.label}`,
              description: `${planConfig.storageLabel} storage`,
              images: [],
            },
          },
        },
      ],
      metadata: {
        userId,
        plan,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    const url = session.url;
    if (!url) {
      return Response.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return Response.json({ url });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
