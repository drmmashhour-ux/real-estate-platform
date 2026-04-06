import { NextRequest } from "next/server";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { parseCloverHostedCheckoutWebhook } from "@/lib/payments/clover/parseWebhook";
import { verifyCloverHostedCheckoutSignature } from "@/lib/payments/clover/verifyWebhookSignature";
import { markOrchestratedPaymentFromCloverSession } from "@/lib/payments/webhook-bridge";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/clover — Clover Hosted Checkout notifications.
 * Configure URL + signing secret in Clover Dashboard (Ecommerce → Hosted Checkout).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CLOVER_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret) {
    logWarn("CLOVER_WEBHOOK_SIGNING_SECRET not set — rejecting Clover webhook");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const sig = req.headers.get("clover-signature") ?? req.headers.get("Clover-Signature");
  if (!verifyCloverHostedCheckoutSignature(raw, sig, secret)) {
    logWarn("Clover webhook signature verification failed");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    logError("Clover webhook: invalid JSON", new Error("parse"));
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCloverHostedCheckoutWebhook(body);
  if (!parsed.checkoutSessionId) {
    logInfo("Clover webhook: no checkout session id — acknowledged", { body });
    return Response.json({ received: true, ignored: "no_checkout_session" });
  }

  try {
    if (parsed.approved) {
      const r = await markOrchestratedPaymentFromCloverSession({
        checkoutSessionId: parsed.checkoutSessionId,
        approved: true,
        cloverPaymentId: parsed.paymentId,
      });
      return Response.json({ received: true, applied: r.applied });
    }
    if (parsed.failed) {
      const r = await markOrchestratedPaymentFromCloverSession({
        checkoutSessionId: parsed.checkoutSessionId,
        approved: false,
        cloverPaymentId: parsed.paymentId,
      });
      return Response.json({ received: true, applied: r.applied });
    }
  } catch (e) {
    logError("Clover webhook: orchestration handler failed", e);
    return Response.json({ error: "Handler error" }, { status: 500 });
  }

  logInfo("Clover webhook: ambiguous status — acknowledged without ledger update", {
    checkoutSessionId: parsed.checkoutSessionId,
  });
  return Response.json({ received: true, ignored: "ambiguous_status" });
}
