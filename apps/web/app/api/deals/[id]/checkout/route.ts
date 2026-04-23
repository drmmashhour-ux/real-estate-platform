/**
 * POST /api/deals/[id]/checkout – Create Stripe checkout for deal deposit or closing_fee.
 * Body: paymentType ("deposit" | "closing_fee"), amountCents, successUrl, cancelUrl.
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isStripeConfigured()) {
    return Response.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const { id: dealId } = await context.params;
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
  });
  if (!deal) return Response.json({ error: "Deal not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentType = body.paymentType === "deposit" || body.paymentType === "closing_fee" ? body.paymentType : null;
  const amountCents = typeof body.amountCents === "number" ? body.amountCents : Number(body.amountCents);
  const successUrl = typeof body.successUrl === "string" ? body.successUrl : "";
  const cancelUrl = typeof body.cancelUrl === "string" ? body.cancelUrl : "";

  if (!paymentType || !Number.isFinite(amountCents) || amountCents < 1 || !successUrl || !cancelUrl) {
    return Response.json(
      { error: "paymentType (deposit|closing_fee), amountCents, successUrl, cancelUrl required" },
      { status: 400 }
    );
  }

  const result = await createCheckoutSession({
    successUrl,
    cancelUrl,
    amountCents: Math.round(amountCents),
    paymentType,
    userId,
    dealId,
    brokerId: deal.brokerId ?? undefined,
    description: `Deal ${paymentType}: ${dealId}`,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ url: result.url });
}
