import type Stripe from "stripe";
import { createCheckoutSession, type PaymentType as StripeCheckoutPaymentType } from "@/lib/stripe/checkout";
import { createWorkspaceCheckoutSession } from "@/modules/billing/createWorkspaceCheckoutSession";
import type { CreatePaymentSessionInput } from "@/lib/payments/types";
import { assertSafeMetadata } from "@/lib/payments/security";
import { markOrchestratedPaymentFromStripeSession } from "@/lib/payments/webhook-bridge";

export function paymentIntentIdFromCheckoutSession(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  if (pi && typeof pi === "object" && "id" in pi) {
    return (pi as Stripe.PaymentIntent).id;
  }
  return null;
}

/**
 * Stripe webhook entrypoint: sync orchestration ledger (and normalized launch_events via bridge).
 */
export async function stripeHandleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  ctx?: { stripeEventId?: string | null }
): Promise<void> {
  const paidLike =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  await markOrchestratedPaymentFromStripeSession({
    sessionId: session.id,
    succeeded: paidLike,
    stripePaymentIntentId: paymentIntentIdFromCheckoutSession(session),
    stripeEventId: ctx?.stripeEventId ?? null,
    stripePaymentType: typeof session.metadata?.paymentType === "string" ? session.metadata.paymentType : null,
  });
}

function mapToStripePaymentType(t: CreatePaymentSessionInput["paymentType"]): StripeCheckoutPaymentType | null {
  switch (t) {
    case "booking":
      return "booking";
    case "listing_upgrade":
      return "featured_listing";
    case "office_payment":
      return null;
    case "subscription":
      return null;
    default:
      return "booking";
  }
}

/**
 * Stripe primary adapter — wraps existing `createCheckoutSession` / workspace subscription flow.
 */
export async function stripeCreateOrchestratedCheckout(
  input: CreatePaymentSessionInput,
  fees: { platformFeeCents: number; hostAmountCents: number }
): Promise<{ url: string; providerPaymentId: string | null } | { error: string }> {
  const meta = assertSafeMetadata(input.metadata);

  if (input.paymentType === "subscription") {
    const email = input.userEmail?.trim();
    if (!email) {
      return { error: "userEmail required for subscription checkout" };
    }
    const subscriptionLookupKey = process.env.STRIPE_SUBSCRIPTION_CHECKOUT_LOOKUP_KEY?.trim();
    const result = await createWorkspaceCheckoutSession({
      userId: input.userId,
      userEmail: email,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      planCode: input.planCode ?? undefined,
      priceId: input.priceId ?? undefined,
      lookupKey: subscriptionLookupKey || undefined,
      workspaceId: input.workspaceId ?? undefined,
      extraSessionMetadata: {
        orchestrated: "true",
        orchestratedPaymentType: input.paymentType,
        orchestratedPlatformFeeCents: String(fees.platformFeeCents),
        orchestratedHostAmountCents: String(fees.hostAmountCents),
      },
    });
    if ("error" in result) return { error: result.error };
    return { url: result.url, providerPaymentId: result.sessionId };
  }

  const stripeType = mapToStripePaymentType(input.paymentType);
  if (!stripeType) {
    return { error: "Stripe checkout not used for this payment type" };
  }

  const result = await createCheckoutSession({
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    amountCents: input.amountCents,
    currency: input.currency ?? "cad",
    paymentType: stripeType,
    userId: input.userId,
    listingId: input.listingId ?? undefined,
    bookingId: input.bookingId ?? undefined,
    description: input.description,
    metadata: {
      ...meta,
      orchestrated: "true",
      orchestratedPlatformFeeCents: String(fees.platformFeeCents),
      orchestratedHostAmountCents: String(fees.hostAmountCents),
    },
    connect: input.stripeConnect,
  });

  if ("error" in result) return { error: result.error };
  return { url: result.url, providerPaymentId: result.sessionId };
}
