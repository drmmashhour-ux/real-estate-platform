import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { getLeadPricingForBroker } from "@/modules/monetization/pricing-psychology.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json({ error: "Only brokers can purchase leads" }, { status: 403 });
    }

    const { leadId, successUrl, cancelUrl } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: "successUrl and cancelUrl are required" }, { status: 400 });
    }

    // 1. Verify lead availability
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { leadStatus: true, purchasedByBrokerId: true, name: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.leadStatus !== "NEW" || lead.purchasedByBrokerId) {
      return NextResponse.json({ error: "Lead already purchased or unavailable" }, { status: 400 });
    }

    // 2. Get psychological pricing
    const pricingDisplay = await getLeadPricingForBroker(userId, leadId);
    const amountCents = pricingDisplay.price * 100;

    const session = await createCheckoutSession({
      userId,
      paymentType: "lead_purchase",
      amountCents,
      currency: "cad",
      leadId,
      description: `Purchase Lead: ${lead.name}`,
      successUrl,
      cancelUrl,
      metadata: {
        leadId,
        brokerId: userId,
        pricingType: pricingDisplay.type,
        originalPrice: String(pricingDisplay.anchorPrice || pricingDisplay.price)
      }
    });

    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: 500 });
    }

    console.log(`[monetization][lead_purchase] Checkout session created for Broker ${userId}, Lead ${leadId}: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error("[api/leads/purchase] POST failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
