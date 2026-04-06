import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { assertStripeConfigured, getProPriceId, getTeamPriceId } from "@/src/modules/billing-conversion/infrastructure/stripeBillingService";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import type { ConversionPlanCode } from "@/src/modules/billing-conversion/domain/billing.enums";

export async function startCheckoutSession(args: {
  userId: string;
  plan: ConversionPlanCode;
  returnUrl?: string;
}): Promise<{ url: string }> {
  if (args.plan === "free") {
    throw new Error("Invalid plan for checkout");
  }

  const priceId = args.plan === "team" ? getTeamPriceId() : getProPriceId();
  if (!priceId) {
    throw new Error("Checkout is not fully configured. Add STRIPE_LECIPM_PRO_PRICE_ID (and team price if needed).");
  }

  const stripe = assertStripeConfigured();
  const baseUrl = getPublicAppUrl();
  const resume = args.returnUrl ? `&resume=${encodeURIComponent(args.returnUrl)}` : "";
  const successUrl = `${baseUrl}/dashboard/storage?upgrade=success&plan=${args.plan}&closing=1${resume}`;
  const cancelUrl = `${baseUrl}/dashboard/storage?upgrade=cancelled`;

  await trackGrowthFunnelEvent({
    userId: args.userId,
    eventName: "upgrade_started",
    properties: { source: "billing_conversion_checkout", plan: args.plan },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: args.userId,
      planCode: args.plan,
      source: "lecipm_conversion",
    },
    subscription_data: {
      metadata: {
        userId: args.userId,
        planCode: args.plan,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const url = session.url;
  if (!url) throw new Error("Failed to create checkout session");
  return { url };
}
