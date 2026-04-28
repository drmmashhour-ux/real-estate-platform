import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { DESIGN_ACCESS_AMOUNT } from "@/lib/design-access";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const AMOUNT_CENTS = Math.round(DESIGN_ACCESS_AMOUNT * 100);

/**
 * POST /api/design-access/checkout
 * Creates Stripe Checkout Session for design access ($5). Returns { url }.
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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl?.origin || getPublicAppUrl();
    const successUrl = `${baseUrl}/design-templates?design_upgrade=success`;
    const cancelUrl = `${baseUrl}/design-templates?design_upgrade=cancelled`;

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
            unit_amount: AMOUNT_CENTS,
            product_data: {
              name: "Design feature access",
              description: "Unlock design templates and Design Studio after your 7-day trial",
              images: [],
            },
          },
        },
      ],
      metadata: {
        userId,
        plan: "design-access",
        feature: "design-access",
        type: "design_access",
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
