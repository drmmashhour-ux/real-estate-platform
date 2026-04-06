import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createBrokerCheckoutSession } from "@/modules/billing/brokerLeadBilling";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/**
 * POST /api/broker-billing/checkout — Stripe Checkout for one assigned CRM lead (`BrokerLead`).
 * Metadata on session: brokerId, leadId, brokerLeadId, paymentType broker_assigned_lead.
 */
export async function POST(req: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const brokerLeadId = typeof body.brokerLeadId === "string" ? body.brokerLeadId.trim() : "";
  if (!brokerLeadId) {
    return NextResponse.json({ error: "brokerLeadId required" }, { status: 400 });
  }

  const result = await createBrokerCheckoutSession(prisma, stripe, {
    brokerLeadId,
    payingBrokerId: gate.session.id,
    successPath: typeof body.successPath === "string" ? body.successPath : undefined,
    cancelPath: typeof body.cancelPath === "string" ? body.cancelPath : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "invalid_amount" ? 400 : 404 });
  }

  return NextResponse.json({ url: result.url, sessionId: result.sessionId });
}
