import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { brokerRecordPaymentReceived } from "@/modules/investment-flow/crm-deal-investment.service";

export const dynamic = "force-dynamic";

/**
 * POST — broker/admin records capital received (explicit `received: true` only; no auto-settlement).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (auth.deal.brokerId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    subscriptionId?: string;
    amountCents?: number;
    method?: string;
    referenceNumber?: string | null;
    received?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId.trim() : "";
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  try {
    const payment = await brokerRecordPaymentReceived({
      dealId,
      subscriptionId,
      amountCents: typeof body.amountCents === "number" ? Math.floor(body.amountCents) : 0,
      method: typeof body.method === "string" ? body.method : "",
      referenceNumber: body.referenceNumber,
      received: body.received === true,
      recordedByUserId: auth.userId,
    });
    return NextResponse.json({
      ok: true,
      payment: {
        id: payment.id,
        amountCents: payment.amountCents,
        method: payment.method,
        received: payment.received,
        receivedAt: payment.receivedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    const status =
      msg === "SUBSCRIPTION_NOT_FOUND" ? 404
      : msg === "SUBSCRIPTION_NOT_SIGNED" || msg === "SPV_REQUIRED_FOR_FUNDING" ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
