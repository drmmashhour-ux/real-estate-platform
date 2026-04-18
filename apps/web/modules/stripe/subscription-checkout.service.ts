import { createWorkspaceCheckoutSession } from "@/modules/billing/createWorkspaceCheckoutSession";

export type HostPlanCheckoutInput = {
  userId: string;
  userEmail: string;
  planKey: "pro" | "growth";
  successUrl: string;
  cancelUrl: string;
};

/**
 * Delegates to existing workspace Stripe subscription checkout (host Pro/Growth).
 */
export async function createHostSubscriptionCheckoutSession(input: HostPlanCheckoutInput) {
  const lookupKey =
    input.planKey === "growth"
      ? process.env.STRIPE_LOOKUP_LECIPM_HOST_GROWTH?.trim()
      : process.env.STRIPE_LOOKUP_LECIPM_HOST_PRO?.trim();

  const planCode = input.planKey === "growth" ? "host_growth" : "host_pro";

  return createWorkspaceCheckoutSession({
    userId: input.userId,
    userEmail: input.userEmail,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    ...(lookupKey ? { lookupKey } : {}),
    planCode,
    extraSessionMetadata: { hostPlanKey: input.planKey },
  });
}
