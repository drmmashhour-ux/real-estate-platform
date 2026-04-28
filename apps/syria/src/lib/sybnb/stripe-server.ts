/**
 * ORDER SYBNB-110 — Stripe server helpers (Checkout + webhooks).
 * Live (`sk_live_*`) keys are rejected unless explicitly allowed — prefer `sk_test_*` only.
 */
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

function stripeSecretKeyRaw(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

/** Rejects `sk_live_*` in Syria SYBNB unless `SYBNB_STRIPE_ALLOW_LIVE=true` (discouraged). */
export function assertSyriaStripeSecretIsNonLive(secret: string): void {
  if (secret.startsWith("sk_live_") && process.env.SYBNB_STRIPE_ALLOW_LIVE !== "true") {
    throw new Error(
      "SYBNB Stripe: live secret keys (sk_live_) are blocked — use sk_test_* or set SYBNB_STRIPE_ALLOW_LIVE=true only when deliberately enabled.",
    );
  }
}

export function getStripeWebhookSigningSecret(): string | null {
  const s =
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ??
    process.env.SYBNB_STRIPE_WEBHOOK_SECRET?.trim() ??
    "";
  return s.length > 0 ? s : null;
}

export function getStripeClient(): Stripe {
  const secret = stripeSecretKeyRaw();
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  assertSyriaStripeSecretIsNonLive(secret);
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secret);
  }
  return stripeSingleton;
}

/** Stripe Checkout uses settlement currency; SYP is not supported — convert via approximate rate (test/staging). */
export function sybnbStayTotalUsdCents(totalSyp: { toString(): string }, nights: number): number {
  const rateRaw = Number(process.env.SYBNB_STRIPE_SYP_PER_USD ?? "13000");
  const rate = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : 13000;
  const syp = Number(totalSyp.toString());
  if (!Number.isFinite(syp) || syp <= 0) {
    return Math.max(50, nights * 100);
  }
  const usd = syp / rate;
  const cents = Math.round(usd * 100);
  return Math.max(50, Math.min(cents, 999_999_99));
}

export function sybnbAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SYRIA_APP_URL?.trim() || "http://localhost:3002";
}
