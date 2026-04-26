import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createBrokerInvoiceBatchCheckout } from "@/modules/billing/brokerLeadBilling";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/**
 * POST /api/broker-billing/invoice-checkout — batch unpaid `BrokerLead` rows into one invoice + Stripe Checkout.
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
  const targetBrokerId =
    gate.session.role === "ADMIN" && typeof body.brokerId === "string"
      ? body.brokerId.trim()
      : gate.session.id;

  const result = await createBrokerInvoiceBatchCheckout(prisma, stripe, {
    brokerId: targetBrokerId,
    successPath: typeof body.successPath === "string" ? body.successPath : undefined,
    cancelPath: typeof body.cancelPath === "string" ? body.cancelPath : undefined,
  });

  if (!result.ok) {
    const status = result.error === "no_unpaid_leads" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    url: result.url,
    sessionId: result.sessionId,
    brokerInvoiceId: result.brokerInvoiceId,
  });
}
