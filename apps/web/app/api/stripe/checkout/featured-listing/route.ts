import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { prisma } from "@repo/db";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import {
  durationDaysForFsboFeaturedPlan,
  minAmountCentsForFsboFeaturedPlan,
  type FsboFeaturedPlanKey,
  FSBO_FEATURED_PLAN_KEYS,
} from "@/lib/featured/fsbo-featured-plans";
import { engineFlags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  fsboListingId: z.string().trim().min(1).max(48),
  featuredPlanKey: z.enum(FSBO_FEATURED_PLAN_KEYS).optional(),
});

/**
 * POST /api/stripe/checkout/featured-listing — FSBO featured boost (hosted Checkout only).
 * Body: { fsboListingId: string, featuredPlanKey?: FsboFeaturedPlanKey }
 */
export async function POST(req: Request) {
  if (!isStripeConfigured() || !getStripe()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  if (!engineFlags.featuredListingsV1) {
    return NextResponse.json({ error: "Featured listings are not enabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const rl = checkRateLimit(`stripe:featured_fsbo:${userId}`, { windowMs: 60_000, max: 6 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const fsboListingId = parsed.data.fsboListingId;
  const planKey = (parsed.data.featuredPlanKey ?? "featured_fsbo_30d") as FsboFeaturedPlanKey;

  if (!isReasonableListingId(fsboListingId)) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { id: true, ownerId: true, status: true, moderationStatus: true, title: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.status !== "ACTIVE" || listing.moderationStatus !== "APPROVED") {
    return NextResponse.json({ error: "Listing must be active and approved" }, { status: 400 });
  }

  const amountCents = minAmountCentsForFsboFeaturedPlan(planKey);
  const days = durationDaysForFsboFeaturedPlan(planKey);
  const base = getPublicAppUrl();

  let checkout;
  try {
    checkout = await createCheckoutSession({
    successUrl: `${base}/dashboard/seller/listings/${fsboListingId}?featured=success`,
    cancelUrl: `${base}/dashboard/seller/listings/${fsboListingId}?featured=cancel`,
    amountCents,
    currency: "cad",
    paymentType: "featured_listing",
    userId,
    description: `Featured FSBO listing (${days} days)`,
    fsboListingId,
    metadata: {
      featuredPlanKey: planKey,
      listingTitle: listing.title.slice(0, 120),
    },
  });
  } catch (e) {
    logError("featured_listing_checkout_failed", { userId, fsboListingId, err: e });
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 502 });
  }

  if ("error" in checkout) {
    return NextResponse.json({ error: checkout.error }, { status: 502 });
  }

  void trackFunnelEvent("featured_checkout_started", {
    fsboListingId,
    userId,
    sessionId: checkout.sessionId,
    planKey,
  });

  return NextResponse.json({ url: checkout.url, sessionId: checkout.sessionId, amountCents, planKey });
}
