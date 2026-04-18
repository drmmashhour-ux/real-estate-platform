import type { PrismaClient } from "@prisma/client";
import { durationDaysForFsboFeaturedPlan, minAmountCentsForFsboFeaturedPlan } from "./fsbo-featured-plans";

export type FulfillFsboFeaturedResult = { ok: true } | { ok: false; reason: string };

/**
 * After successful Stripe Checkout for FSBO featured — extend `featuredUntil` and persist audit row.
 * Idempotent on `stripeCheckoutSessionId`.
 */
export async function fulfillFsboFeaturedFromStripeSession(
  db: PrismaClient,
  input: {
    payerUserId: string;
    fsboListingId: string;
    amountCents: number;
    stripeCheckoutSessionId: string;
    stripePaymentIntentId: string | null;
    stripeCustomerId: string | null;
    featuredPlanKey: string;
  },
): Promise<FulfillFsboFeaturedResult> {
  const existing = await db.featuredListing.findFirst({
    where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
    select: { id: true },
  });
  if (existing) return { ok: true };

  const listing = await db.fsboListing.findUnique({
    where: { id: input.fsboListingId },
    select: { id: true, ownerId: true, status: true, moderationStatus: true },
  });
  if (!listing) return { ok: false, reason: "listing_not_found" };
  if (listing.ownerId !== input.payerUserId) return { ok: false, reason: "owner_mismatch" };
  if (listing.status !== "ACTIVE" || listing.moderationStatus !== "APPROVED") {
    return { ok: false, reason: "listing_not_active_approved" };
  }

  const minCents = minAmountCentsForFsboFeaturedPlan(input.featuredPlanKey);
  if (input.amountCents < minCents) {
    return { ok: false, reason: "amount_below_floor" };
  }

  const days = durationDaysForFsboFeaturedPlan(input.featuredPlanKey);
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + days * 86400000);

  await db.$transaction([
    db.featuredListing.updateMany({
      where: {
        listingKind: "fsbo",
        listingId: input.fsboListingId,
        status: "active",
        endAt: { gt: new Date() },
      },
      data: { status: "expired" },
    }),
    db.fsboListing.update({
      where: { id: input.fsboListingId },
      data: { featuredUntil: endAt },
    }),
    db.featuredListing.create({
      data: {
        listingKind: "fsbo",
        listingId: input.fsboListingId,
        ownerUserId: listing.ownerId,
        startAt,
        endAt,
        priority: 1,
        status: "active",
        source: "stripe_checkout_fsbo_featured",
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        stripeCustomerId: input.stripeCustomerId,
      },
    }),
  ]);

  return { ok: true };
}
