import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentWebhook } from "@/modules/finance/services/payment-provider-adapter";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/payments — placeholder for Stripe / PSP webhooks.
 * Verify signature and persist events in a future iteration.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = raw;
  }
  const sig = request.headers.get("stripe-signature") ?? request.headers.get("x-signature");
  const result = await verifyPaymentWebhook(payload, sig);
  return NextResponse.json({ ok: result.ok, received: true }, { status: result.ok ? 200 : 400 });
}
