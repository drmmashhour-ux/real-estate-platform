import { NextResponse } from "next/server";
import { z } from "zod";
import type { ListingContactTargetKind } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { PRICING } from "@/lib/monetization/pricing";
import { compactStripeMetadata } from "@/lib/stripe/checkoutMetadata";
import {
  assertListingContactTargetValid,
  attachStripeSessionToListingContactPurchase,
  ensureListingContactLeadCheckoutRow,
} from "@/lib/leads";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { ListingAnalyticsKind } from "@prisma/client";
import { incrementUnlockCheckoutStart } from "@/lib/listings/listing-analytics-service";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";
import { logInfo, logWarn } from "@/lib/logger";
import { stripeSecretBlockedInTestMode } from "@/lib/stripe/test-mode-stripe-guard";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  targetKind: z.enum(["FSBO_LISTING", "CRM_LISTING"]),
  targetListingId: z.string().min(1),
});

export async function POST(req: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const testStripeBlock = stripeSecretBlockedInTestMode();
  if (testStripeBlock) {
    logWarn("[checkout] blocked live Stripe in test mode (lead unlock)");
    return NextResponse.json({ error: testStripeBlock }, { status: 403 });
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

  const targetKind = parsed.data.targetKind as ListingContactTargetKind;
  const targetListingId = parsed.data.targetListingId.trim();

  logInfo("[cta_click] listing contact unlock checkout start", {
    userId,
    listingId: targetListingId,
    targetKind,
  });

  const valid = await assertListingContactTargetValid(targetKind, targetListingId);
  if (!valid.ok) {
    return NextResponse.json({ error: valid.error }, { status: 404 });
  }

  let purchase;
  try {
    purchase = await ensureListingContactLeadCheckoutRow({
      buyerUserId: userId,
      targetKind,
      targetListingId,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "already_paid") {
      return NextResponse.json({ error: "Contact already unlocked" }, { status: 409 });
    }
    throw e;
  }

  const base = getPublicAppUrl();
  const successUrl = `${base}/leads/success?purchaseId=${encodeURIComponent(purchase.id)}`;
  const cancelUrl = `${base}/leads/cancel`;

  const metadata = compactStripeMetadata({
    userId,
    paymentType: "listing_contact_lead",
    listingContactPurchaseId: purchase.id,
    listingContactTargetKind: targetKind,
    listingId: targetListingId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: "Listing contact access",
            description: "Unlock host / broker representative contact for this listing.",
          },
          unit_amount: purchase.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    client_reference_id: purchase.id,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe session missing URL" }, { status: 502 });
  }

  await attachStripeSessionToListingContactPurchase(purchase.id, userId, session.id);

  const analyticsKind =
    targetKind === "FSBO_LISTING" ? ListingAnalyticsKind.FSBO : ListingAnalyticsKind.CRM;
  void incrementUnlockCheckoutStart(analyticsKind, targetListingId).catch(() => {});

  void trackFunnelEvent("lead_checkout_started", {
    purchaseId: purchase.id,
    targetKind,
    targetListingId,
    userId,
  });

  logInfo("[checkout] listing contact unlock session created", {
    purchaseId: purchase.id,
    sessionId: session.id,
    targetKind,
    targetListingId,
    userId,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id, purchaseId: purchase.id });
}
