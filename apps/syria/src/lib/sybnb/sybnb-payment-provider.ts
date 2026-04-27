import { createHmac, timingSafeEqual } from "node:crypto";
import { sybnbConfig } from "@/config/sybnb.config";

/**
 * Payment / PSP edge — all SYBNB payment calls should use this instead of ad hoc env checks.
 * Wire Stripe SDK in `createLivePaymentIntent` when product enables.
 */
export function getActiveSybnbPaymentProviderId(): string {
  return sybnbConfig.provider;
}

/**
 * When `SYBNB_STRIPE_WEBHOOK_SECRET` is set, the caller must pass the same in `x-sybnb-webhook-secret`.
 * Live Stripe: add `verifyStripeWebhookSignature(rawBody, headers)` with `STRIPE_WEBHOOK_SECRET`.
 */
export function verifySybnbAppWebhookSecret(received: string | null, configuredSecret: string | null): boolean {
  const s = configuredSecret?.trim() ?? "";
  if (!s) return true;
  const r = received?.trim() ?? "";
  if (r.length === 0 || s.length === 0) return false;
  if (r.length !== s.length) {
    // timingSafeEqual same length only; fall back to constant-time-ish compare
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(r, "utf8"), Buffer.from(s, "utf8"));
  } catch {
    return false;
  }
}

/**
 * HMAC of raw body (optional second layer) — set `SYBNB_WEBHOOK_BODY_HMAC_SECRET` to enable.
 */
export function verifyOptionalSybnbWebhookBodyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SYBNB_WEBHOOK_BODY_HMAC_SECRET?.trim() ?? "";
  if (!secret) return true;
  if (!hmacHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(hmacHeader.trim().toLowerCase(), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
