import { NextResponse } from "next/server";
import { sybnbConfig } from "@/config/sybnb.config";
import { applySybnbCheckoutComplete } from "@/lib/sybnb/apply-sybnb-checkout";
import { verifyOptionalSybnbWebhookBodyHmac, verifySybnbAppWebhookSecret } from "@/lib/sybnb/sybnb-payment-provider";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";

function assertWebhookSignature(req: Request) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature?.trim()) {
    throw new Error("Missing webhook signature");
  }
}

/**
 * Stripe / PSP webhook — verify shared secret (and optional HMAC) before mutating money state. SYBNB-7: uniform error JSON.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    assertWebhookSignature(req);
  } catch {
    return sybnbFail("Invalid webhook", 400);
  }

  const rawBody = await req.text();

  await logSecurityEvent({
    action: "webhook_received",
    metadata: { bytes: rawBody.length, hasStripeSignature: Boolean(req.headers.get("stripe-signature")?.trim()) },
  });

  const secret = process.env.SYBNB_STRIPE_WEBHOOK_SECRET?.trim() ?? null;
  if (sybnbConfig.requireWebhookSharedSecret && !secret) {
    return sybnbFail("webhook_secret_not_configured", 503);
  }
  if (secret && !verifySybnbAppWebhookSecret(req.headers.get("x-sybnb-webhook-secret"), secret)) {
    return sybnbFail("unauthorized", 401);
  }
  const hmacHeader = req.headers.get("x-sybnb-body-hmac");
  if (!verifyOptionalSybnbWebhookBodyHmac(rawBody, hmacHeader)) {
    return sybnbFail("invalid_body_hmac", 401);
  }

  let body: unknown;
  try {
    body = rawBody.length > 0 ? (JSON.parse(rawBody) as unknown) : {};
  } catch {
    return sybnbFail("invalid_json", 400);
  }
  if (!body || typeof body !== "object") {
    return sybnbFail("invalid_body", 400);
  }

  const o = body as Record<string, unknown>;
  let bookingId = "";
  const type = typeof o.type === "string" ? o.type : "";
  if (type === "checkout.session.completed" && o.data && typeof o.data === "object") {
    const data = o.data as Record<string, unknown>;
    const obj = data.object && typeof data.object === "object" ? (data.object as Record<string, unknown>) : null;
    const meta = obj?.metadata && typeof obj.metadata === "object" ? (obj.metadata as Record<string, unknown>) : null;
    bookingId = typeof meta?.bookingId === "string" ? meta.bookingId : "";
  }
  if (!bookingId && typeof o.bookingId === "string") {
    bookingId = o.bookingId;
  }
  if (!bookingId.trim()) {
    return sybnbFail("missing_booking_id", 400);
  }

  const applied = await applySybnbCheckoutComplete(bookingId, { growthEventSource: "sybnb_webhook" });
  if (!applied.ok) {
    const e = applied.error;
    if (e.code === "payment_gated") {
      return NextResponse.json(
        { success: false, error: e.reason, reason: e.reason, detail: e.detail, riskCodes: e.riskCodes },
        { status: e.status },
      );
    }
    return sybnbFail(e.code, e.status);
  }

  return sybnbJson({ received: true });
}
