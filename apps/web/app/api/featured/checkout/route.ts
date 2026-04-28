import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { PRICING } from "@/lib/monetization/pricing";
import { compactStripeMetadata } from "@/lib/stripe/checkoutMetadata";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  shortTermListingId: z.string().min(1),
});

export async function POST(req: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
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

  const shortTermListingId = parsed.data.shortTermListingId.trim();
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: shortTermListingId },
    select: { id: true, ownerId: true, listingStatus: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.listingStatus !== "PUBLISHED" && listing.listingStatus !== "APPROVED") {
    return NextResponse.json({ error: "Listing must be published before featuring" }, { status: 400 });
  }

  const base = getPublicAppUrl();
  const metadata = compactStripeMetadata({
    userId,
    paymentType: "featured_listing",
    listingId: shortTermListingId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "Featured BNHUB listing (30 days)",
          },
          unit_amount: PRICING.featuredListingPriceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${base}/bnhub/host/dashboard?featured=success`,
    cancel_url: `${base}/bnhub/host/dashboard?featured=cancel`,
    metadata,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe session missing URL" }, { status: 502 });
  }

  void trackFunnelEvent("featured_checkout_started", {
    shortTermListingId,
    userId,
    sessionId: session.id,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
