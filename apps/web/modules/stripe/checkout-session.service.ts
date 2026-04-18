import { createCheckoutSession, type CreateCheckoutParams } from "@/lib/stripe/checkout";
import { recordLecipmMonetizationTransaction } from "@/lib/monetization/lecipm-financial-operations";

/**
 * Stripe Checkout session + LECIPM monetization transaction row (pending until webhook confirms).
 */
export async function createMonetizationCheckoutSession(
  params: CreateCheckoutParams & { logUserId: string | null }
): Promise<{ url: string; sessionId: string; transactionId: string } | { error: string }> {
  const session = await createCheckoutSession(params);
  if ("error" in session) return session;

  const tx = await recordLecipmMonetizationTransaction({
    userId: params.logUserId,
    type: `checkout_${params.paymentType}`,
    amount: params.amountCents / 100,
    currency: params.currency ?? "CAD",
    status: "checkout_session_created",
    metadata: {
      sessionId: session.sessionId,
      paymentType: params.paymentType,
    },
  });

  return { ...session, transactionId: tx.id };
}
