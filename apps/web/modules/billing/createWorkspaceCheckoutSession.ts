import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { LECIPM_WORKSPACE_CHECKOUT } from "@/modules/billing/constants";

export type CreateWorkspaceCheckoutInput = {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  /** Defaults from STRIPE_PRICE_LECIPM_PRO */
  priceId?: string;
  planCode?: string;
  /** Optional org/workspace scope — forwarded to Stripe + subscription metadata. */
  workspaceId?: string;
};

/**
 * Stripe Checkout in `subscription` mode for LECIPM workspace plans.
 * Requires `STRIPE_PRICE_LECIPM_PRO` (or pass `priceId`) in environment.
 */
export async function createWorkspaceCheckoutSession(
  input: CreateWorkspaceCheckoutInput
): Promise<{ url: string; sessionId: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured" };
  }
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured" };

  const priceId = input.priceId?.trim() || process.env.STRIPE_PRICE_LECIPM_PRO?.trim();
  if (!priceId) {
    return { error: "Missing STRIPE_PRICE_LECIPM_PRO or priceId for workspace subscription" };
  }

  const planCode = input.planCode?.trim() || "pro";
  const workspaceId = input.workspaceId?.trim() ?? "";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId,
        paymentType: LECIPM_WORKSPACE_CHECKOUT,
        lecipmWorkspace: "true",
        planCode,
        ...(workspaceId ? { workspaceId } : {}),
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          paymentType: LECIPM_WORKSPACE_CHECKOUT,
          lecipmWorkspace: "true",
          planCode,
          ...(workspaceId ? { workspaceId } : {}),
        },
      },
    });

    const url = session.url;
    if (!url) return { error: "Failed to get checkout URL" };
    return { url, sessionId: session.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create subscription checkout" };
  }
}
