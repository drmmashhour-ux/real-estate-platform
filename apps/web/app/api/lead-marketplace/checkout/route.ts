import { NextResponse } from "next/server";
import { LeadMarketplaceStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import {
  countBrokerMarketplacePurchasesThisMonth,
  getBrokerEntitlementsForUser,
} from "@/modules/subscription/application/getBrokerEntitlements";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/lead-marketplace/checkout — Stripe Checkout for purchasing a marketplace lead.
 */
export async function POST(req: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const marketplaceListingId = typeof body.marketplaceListingId === "string" ? body.marketplaceListingId : "";
  if (!marketplaceListingId) {
    return NextResponse.json({ error: "marketplaceListingId required" }, { status: 400 });
  }

  const listing = await prisma.leadMarketplaceListing.findUnique({
    where: { id: marketplaceListingId },
  });
  if (!listing || listing.status !== LeadMarketplaceStatus.available) {
    return NextResponse.json({ error: "Listing not available" }, { status: 400 });
  }

  const ent = await getBrokerEntitlementsForUser(prisma, gate.session.id);
  const used = await countBrokerMarketplacePurchasesThisMonth(prisma, gate.session.id);
  if (used >= ent.maxMarketplacePurchasesPerMonth) {
    return NextResponse.json(
      { error: "Monthly marketplace purchase limit reached for your plan", plan: ent.plan },
      { status: 403 }
    );
  }

  const base = getSiteBaseUrl();
  const successUrl = `${base}/dashboard/broker?marketplace=success`;
  const cancelUrl = `${base}/dashboard/broker?marketplace=cancel`;

  try {
    await prisma.trafficEvent
      .create({
        data: {
          eventType: "lead_checkout_started",
          path: "/dashboard/broker",
          source: "lead_marketplace",
          medium: "product",
          meta: {
            buyerUserId: gate.session.id,
            marketplaceListingId: listing.id,
            leadId: listing.leadId,
            priceCents: listing.priceCents,
          } as object,
        },
      })
      .catch(() => {});

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: undefined,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "LECIPM lead marketplace",
              description: `Lead ${listing.leadId.slice(0, 8)}… — scored FSBO / CRM lead`,
            },
            unit_amount: listing.priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentType: "lead_marketplace",
        userId: gate.session.id,
        marketplaceListingId: listing.id,
        leadId: listing.leadId,
      },
    });

    await prisma.leadMarketplaceListing.update({
      where: { id: listing.id },
      data: { stripeSessionId: session.id },
    });

    const url = session.url;
    if (!url) return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    return NextResponse.json({ url, sessionId: session.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
