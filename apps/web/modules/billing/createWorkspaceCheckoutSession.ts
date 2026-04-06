import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { LECIPM_WORKSPACE_CHECKOUT } from "@/modules/billing/constants";

export type CreateWorkspaceCheckoutInput = {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  /** Stripe Price lookup_key (alternative to priceId). */
  lookupKey?: string;
  /** Defaults from STRIPE_PRICE_LECIPM_PRO when neither lookupKey nor priceId set */
  priceId?: string;
  planCode?: string;
  /** Optional org/workspace scope — forwarded to Stripe + subscription metadata. */
  workspaceId?: string;
  /** Merged into Checkout Session + subscription_data metadata (e.g. orchestration flags). */
  extraSessionMetadata?: Record<string, string>;
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

  let priceId = input.priceId?.trim() || "";
  const lookupKey = input.lookupKey?.trim();
  if (lookupKey) {
    const listed = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    const resolved = listed.data[0]?.id;
    if (!resolved) {
      return { error: `No active Stripe price for lookup_key "${lookupKey}"` };
    }
    priceId = resolved;
  }
  if (!priceId) {
    priceId = process.env.STRIPE_PRICE_LECIPM_PRO?.trim() ?? "";
  }
  if (!priceId) {
    return { error: "Provide priceId, lookupKey, or STRIPE_PRICE_LECIPM_PRO for workspace subscription" };
  }

  const planCode = input.planCode?.trim() || "pro";
  const workspaceId = input.workspaceId?.trim() ?? "";
  const extra = input.extraSessionMetadata ?? {};

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
        ...extra,
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          paymentType: LECIPM_WORKSPACE_CHECKOUT,
          lecipmWorkspace: "true",
          planCode,
          ...(workspaceId ? { workspaceId } : {}),
          ...extra,
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
