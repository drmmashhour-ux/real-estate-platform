/**
 * Centralized Stripe env checks for API routes and scripts (fail-fast messaging).
 */

export function describeStripeSecretKeyError(): string | null {
  const k = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!k) return "STRIPE_SECRET_KEY is empty — add sk_test_… or sk_live_… to apps/web/.env";
  if (k.startsWith("pk_")) {
    return "STRIPE_SECRET_KEY must be the secret key (sk_…), not the publishable key (pk_…)";
  }
  if (!k.startsWith("sk_test_") && !k.startsWith("sk_live_")) {
    return "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_";
  }
  return null;
}

export function describeStripeWebhookSecretError(): string | null {
  const w = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!w) return "STRIPE_WEBHOOK_SECRET is empty — use Dashboard signing secret or `stripe listen` whsec_…";
  if (!w.startsWith("whsec_")) return "STRIPE_WEBHOOK_SECRET must start with whsec_";
  return null;
}

export function assertStripeSecretsForScripts(): void {
  const skErr = describeStripeSecretKeyError();
  const whErr = describeStripeWebhookSecretError();
  if (skErr || whErr) {
    console.error("FATAL: Stripe environment invalid for validation.");
    if (skErr) console.error(`  ${skErr}`);
    if (whErr) console.error(`  ${whErr}`);
    process.exit(1);
  }
}
