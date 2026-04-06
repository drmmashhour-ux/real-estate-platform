import type { PrismaClient } from "@prisma/client";
import { PRICING } from "@/lib/monetization/pricing";
import { computePromotionWindowEnd } from "@/lib/bnhub/promotion-orders";

const PLATFORM_FEATURED_SKU = "lecipm_platform_featured_checkout_monthly";

export type FulfillFeaturedListingResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: string };

/**
 * After Stripe `featured_listing` checkout: create/extend BNHub promotion order for the host listing.
 */
export async function fulfillFeaturedListingFromWebhook(
  db: PrismaClient,
  input: {
    payerUserId: string;
    shortTermListingId: string;
    amountCents: number;
    platformPaymentId: string;
  },
): Promise<FulfillFeaturedListingResult> {
  const existing = await db.bnhubPromotionOrder.findFirst({
    where: { platformPaymentId: input.platformPaymentId },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, orderId: existing.id };
  }

  const listing = await db.shortTermListing.findUnique({
    where: { id: input.shortTermListingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) return { ok: false, reason: "listing_not_found" };
  if (listing.ownerId !== input.payerUserId) return { ok: false, reason: "owner_mismatch" };
  if (input.amountCents < PRICING.featuredListingPriceCents) {
    return { ok: false, reason: "amount_too_low" };
  }

  const plan = await db.bnhubPromotionPlan.upsert({
    where: { sku: PLATFORM_FEATURED_SKU },
    create: {
      sku: PLATFORM_FEATURED_SKU,
      name: "Featured listing (platform checkout)",
      placement: "featured_listing",
      billingPeriod: "monthly",
      priceCents: PRICING.featuredListingPriceCents,
      currency: "cad",
      active: true,
      description: "30-day featured window purchased via LECIPM platform checkout.",
    },
    update: {
      priceCents: PRICING.featuredListingPriceCents,
      active: true,
    },
  });

  const startAt = new Date();
  const endAt = computePromotionWindowEnd(startAt, plan.billingPeriod);

  const order = await db.bnhubPromotionOrder.create({
    data: {
      planId: plan.id,
      payerUserId: input.payerUserId,
      shortTermListingId: input.shortTermListingId,
      status: "paid",
      startAt,
      endAt,
      amountCents: input.amountCents,
      platformPaymentId: input.platformPaymentId,
      metadata: { source: "stripe_checkout_featured_listing", sku: PLATFORM_FEATURED_SKU } as object,
    },
  });

  return { ok: true, orderId: order.id };
}
