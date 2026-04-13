/**
 * Dev-time Stripe integration hints. Called from instrumentation (server bootstrap).
 * Does not throw; never logs secret values.
 */

import { isStripeConfigured } from "@/lib/stripe";
import { logWarn } from "@/lib/logger";

function isSkTest(k: string): boolean {
  return k.trim().startsWith("sk_test_");
}

function isWhsec(k: string): boolean {
  return k.trim().startsWith("whsec_");
}

function isPkTest(k: string): boolean {
  return k.trim().startsWith("pk_test_");
}

/**
 * Log clear warnings when Stripe env is incomplete for local BNHUB + webhook validation.
 */
export function logStripeIntegrationEnvWarnings(): void {
  if (process.env.NODE_ENV === "test") return;

  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!sk) {
    logWarn(
      "[lecipm][stripe] STRIPE_SECRET_KEY is unset — payments and BNHUB checkout are disabled (see docs/STRIPE_CONNECT_VALIDATION.md)."
    );
    return;
  }

  if (sk.startsWith("pk_")) {
    logWarn(
      "[lecipm][stripe] STRIPE_SECRET_KEY looks like a publishable key — use the secret key (sk_test_… or sk_live_…)."
    );
  } else if (!isSkTest(sk) && !sk.startsWith("sk_live_")) {
    logWarn("[lecipm][stripe] STRIPE_SECRET_KEY format is unexpected — expected sk_test_* or sk_live_*.");
  }

  if (isStripeConfigured() && !whsec) {
    logWarn(
      "[lecipm][stripe] STRIPE_WEBHOOK_SECRET is unset — Checkout webhooks will not verify locally. Run `stripe listen` and set whsec_* (see docs/STRIPE_CONNECT_VALIDATION.md)."
    );
  } else if (whsec && !isWhsec(whsec)) {
    logWarn("[lecipm][stripe] STRIPE_WEBHOOK_SECRET should start with whsec_ (from Stripe CLI or Dashboard webhook).");
  }

  if (!pk) {
    logWarn(
      "[lecipm][stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is unset — client-side Stripe features may be limited."
    );
  } else if (!isPkTest(pk) && !pk.startsWith("pk_live_")) {
    logWarn("[lecipm][stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format is unexpected.");
  }

  if (isSkTest(sk)) {
    logWarn(
      "[lecipm][stripe] BNHUB booking checkout requires Stripe Connect enabled in the Dashboard + host Connect accounts. If Connect is off, checkout returns 409 with HOST_PAYOUT / STRIPE_CONNECT_PLATFORM_UNAVAILABLE codes (see docs/STRIPE_CONNECT_VALIDATION.md)."
    );
  }
}
