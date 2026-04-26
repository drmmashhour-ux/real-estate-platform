import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { ListingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  shortTermListingId: z.string().trim().min(1).max(48),
});

/**
 * POST /api/stripe/checkout/bnhub-boost — BNHub short-term listing featured boost (hosted Checkout).
 * Reuses `featured_listing` payment type + `listingId` metadata; webhook calls `fulfillFeaturedListingFromWebhook`.
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

  const rl = checkRateLimit(`stripe:bnhub_boost:${userId}`, { windowMs: 60_000, max: 6 });
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

  const shortTermListingId = parsed.data.shortTermListingId;
  if (!isReasonableListingId(shortTermListingId)) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const settings = await getRevenueControlSettings();
  const amountCents = settings.listingBoostPriceCents;
  const days = settings.listingBoostDurationDays;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: shortTermListingId },
    select: { id: true, ownerId: true, title: true, listingStatus: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return NextResponse.json({ error: "Listing must be published" }, { status: 400 });
  }

  const base = getPublicAppUrl().replace(/\/$/, "");

  try {
    const checkout = await createCheckoutSession({
      successUrl: `${base}/bnhub/host/listings/${shortTermListingId}?boost=success`,
      cancelUrl: `${base}/bnhub/host/listings/${shortTermListingId}?boost=cancel`,
      amountCents,
      currency: "cad",
      paymentType: "featured_listing",
      userId,
      listingId: shortTermListingId,
      description: `Boost this listing (${days} days)`,
      metadata: {
        boostDurationDays: String(days),
        listingTitle: listing.title.slice(0, 120),
      },
    });
    if ("error" in checkout) {
      return NextResponse.json({ error: checkout.error }, { status: 502 });
    }
    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.sessionId,
      amountCents,
      durationDays: days,
    });
  } catch (e) {
    logError("bnhub_boost_checkout_failed", { userId, shortTermListingId, err: e });
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 502 });
  }
}
