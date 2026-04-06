import type { Page } from "@playwright/test";

/**
 * PCI: We do not script card numbers (no env PAN, no literals, no `.fill()` on card fields).
 * Automated tests that would require completing Stripe-hosted Checkout must `test.skip` with
 * {@link SKIP_HOSTED_CHECKOUT_AUTOMATED_PAYMENT}.
 */
export const SKIP_HOSTED_CHECKOUT_AUTOMATED_PAYMENT =
  "PCI: Automated tests must not inject PANs or CVC into Stripe Checkout. Complete payment manually on checkout.stripe.com in test mode (use cards from Stripe’s testing docs), or run `pnpm run validate:bnhub-stripe` (Checkout Session + signed webhook, no PAN). See docs/STRIPE_CONNECT_VALIDATION.md.";

/** Confirms the browser reached Stripe-hosted Checkout (no card entry). */
export async function waitForStripeHostedCheckout(page: Page): Promise<void> {
  await page.waitForURL(/checkout\.stripe\.com|c\.stripe\.com/, { timeout: 90_000 });
}
