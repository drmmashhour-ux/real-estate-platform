import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { logWarn } from "@/lib/logger";
import { createCloverHostedCheckoutSession } from "@/lib/payments/clover/hostedCheckout";
import type { CreatePaymentSessionInput } from "@/lib/payments/types";

/**
 * Clover secondary provider — Hosted Checkout when `CLOVER_MERCHANT_ID` + `CLOVER_PRIVATE_TOKEN` are set.
 * **Marketplace / BNHub booking payouts remain Stripe Connect–only** (Clover does not execute host transfers here).
 */
export async function cloverCreateCheckoutSession(
  input: CreatePaymentSessionInput,
  fees: { platformFeeCents: number; hostAmountCents: number }
): Promise<{ url: string; providerPaymentId: string | null } | { error: string }> {
  const hasCreds = Boolean(process.env.CLOVER_MERCHANT_ID?.trim() && process.env.CLOVER_PRIVATE_TOKEN?.trim());

  if (hasCreds) {
    const hosted = await createCloverHostedCheckoutSession({
      amountCents: input.amountCents,
      currency: (input.currency ?? "cad").toLowerCase(),
      description: input.description ?? `${input.paymentType} payment`,
      customerEmail: input.userEmail ?? undefined,
      successUrl: input.successUrl,
      failureUrl: input.cancelUrl,
    });
    if (hosted.ok) {
      return { url: hosted.href, providerPaymentId: hosted.checkoutSessionId };
    }
    logWarn("[clover] hosted checkout API error — using dev placeholder if allowed", { error: hosted.error });
    if (process.env.CLOVER_STRICT === "1") {
      return { error: hosted.error };
    }
  }

  const base =
    process.env.CLOVER_CHECKOUT_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    getPublicAppUrl();
  const path = process.env.CLOVER_CHECKOUT_PATH?.trim() || "/payments/clover-placeholder";
  const q = new URLSearchParams({
    amount_cents: String(input.amountCents),
    currency: input.currency ?? "cad",
    userId: input.userId,
    type: input.paymentType,
    platform_fee_cents: String(fees.platformFeeCents),
    host_amount_cents: String(fees.hostAmountCents),
  });
  if (input.bookingId) q.set("bookingId", input.bookingId);
  const url = `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}?${q.toString()}`;

  return {
    url,
    providerPaymentId: `clover_placeholder_${Date.now()}`,
  };
}
