import Stripe from "stripe";
import { NextResponse } from "next/server";
import { applySybnbCheckoutComplete } from "@/lib/sybnb/apply-sybnb-checkout";
import { getStripeClient, getStripeWebhookSigningSecret } from "@/lib/sybnb/stripe-server";
import { verifyOptionalSybnbWebhookBodyHmac } from "@/lib/sybnb/sybnb-payment-provider";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";

/**
 * Stripe webhook — verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET` (Dashboard endpoint secret or `stripe listen` `whsec_...`).
 * Handles `checkout.session.completed` → confirms pay + PAID on `SyriaBooking`.
 *
 * ORDER SYBNB-110 — test cards via Stripe Checkout; no app-level JSON fallback when Stripe verification is configured.
 */
export async function POST(req: Request): Promise<Response> {
  const signingSecret = getStripeWebhookSigningSecret();
  if (!signingSecret) {
    return sybnbFail("webhook_secret_not_configured", 503);
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  await logSecurityEvent({
    action: "webhook_received",
    metadata: {
      bytes: rawBody.length,
      hasStripeSignature: Boolean(sig?.trim()),
    },
  });

  const hmacHeader = req.headers.get("x-sybnb-body-hmac");
  if (!verifyOptionalSybnbWebhookBodyHmac(rawBody, hmacHeader)) {
    return sybnbFail("invalid_body_hmac", 401);
  }

  if (!sig?.trim()) {
    return sybnbFail("missing_stripe_signature", 400);
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret);
  } catch (e) {
    console.warn("[SYBNB] webhook Stripe verify failed", e instanceof Error ? e.message : e);
    return sybnbFail("invalid_signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingIdRaw =
      (typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : "") ||
      (typeof session.client_reference_id === "string" ? session.client_reference_id : "");
    const bookingId = bookingIdRaw.trim();
    if (!bookingId) {
      return sybnbFail("missing_booking_id", 400);
    }

    const applied = await applySybnbCheckoutComplete(bookingId, {
      growthEventSource: "sybnb_stripe_webhook",
      stripeCheckoutSessionId: session.id,
    });
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

  /** Acknowledge other events so Stripe does not wedge retries on unsupported types */
  return sybnbJson({ received: true, ignored: event.type });
}
