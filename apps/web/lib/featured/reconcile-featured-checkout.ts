import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { fulfillFeaturedListingFromWebhook } from "@/lib/featured/fulfill-featured-checkout-webhook";
import { fulfillFsboFeaturedFromStripeSession } from "@/lib/featured/fulfill-fsbo-featured-webhook";

/**
 * When `platform_payment` already exists for this Checkout session (webhook retry),
 * still run idempotent featured fulfillment so we never leave paid hosts without `featuredUntil`.
 */
export async function reconcileFeaturedListingAfterDuplicatePayment(
  db: PrismaClient,
  input: {
    session: Stripe.Checkout.Session;
    userId: string;
    existingPayment: { id: string; amountCents: number };
  },
): Promise<void> {
  const fsboListingId = input.session.metadata?.fsboListingId;
  const featuredPlanKey = (input.session.metadata?.featuredPlanKey as string | undefined) ?? "featured_fsbo_30d";
  const bnhubListingId = input.session.metadata?.listingId;
  const sessionId = input.session.id;

  const piRaw = input.session.payment_intent;
  const piId =
    typeof piRaw === "string" ? piRaw : piRaw && typeof piRaw === "object" ? (piRaw as Stripe.PaymentIntent).id : null;

  const custRaw = input.session.customer;
  const stripeCustomerId =
    typeof custRaw === "string"
      ? custRaw
      : custRaw && typeof custRaw === "object" && custRaw !== null && "id" in custRaw
        ? String((custRaw as { id: string }).id)
        : null;

  if (typeof fsboListingId === "string" && fsboListingId.trim()) {
    await fulfillFsboFeaturedFromStripeSession(db, {
      payerUserId: input.userId,
      fsboListingId: fsboListingId.trim(),
      amountCents: input.existingPayment.amountCents,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: piId,
      stripeCustomerId,
      featuredPlanKey,
    });
    return;
  }

  if (typeof bnhubListingId === "string" && bnhubListingId.trim()) {
    await fulfillFeaturedListingFromWebhook(db, {
      payerUserId: input.userId,
      shortTermListingId: bnhubListingId.trim(),
      amountCents: input.existingPayment.amountCents,
      platformPaymentId: input.existingPayment.id,
    });
  }
}
