import { isTestMode } from "@/lib/config/app-mode";
import { logWarn } from "@/lib/logger";

/**
 * In `NEXT_PUBLIC_APP_MODE=test`, refuse server routes that would use live Stripe secrets.
 */
export function stripeSecretBlockedInTestMode(): string | null {
  if (!isTestMode()) return null;
  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  if (!sk) return null;
  if (sk.startsWith("sk_live") || sk.startsWith("rk_live")) {
    return "Test mode is on — use Stripe test keys only (sk_test_… / rk_test_…), not live keys.";
  }
  return null;
}

export function warnIfLiveStripeKeyWhileTestMode(): void {
  if (!isTestMode()) return;
  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  if (sk?.startsWith("sk_live") || sk?.startsWith("rk_live")) {
    logWarn("[checkout] Live Stripe key present while NEXT_PUBLIC_APP_MODE=test — use sk_test_ for E2E.");
  }
}
