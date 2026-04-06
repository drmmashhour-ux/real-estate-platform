/**
 * BNHub + Stripe: browser checks that do not script card data (PCI).
 * Full payment on checkout.stripe.com is manual in test mode — see docs/STRIPE_CONNECT_VALIDATION.md.
 * Automated payment path without PAN: `pnpm run validate:bnhub-stripe` (Checkout Session + signed webhook).
 *
 * Prerequisites: STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_* (for Connect-ready flows),
 * DATABASE_URL, seeded DB (guest@demo.com, seed-booking-pending-checkout).
 */
import { expect, test } from "@playwright/test";
import Stripe from "stripe";
import { prisma } from "../lib/db";
import { validateHostStripePayoutReadiness } from "../lib/stripe/hostPayoutReadiness";
import { computeReservationQuoteFromBooking } from "../modules/bnhub-payments/services/paymentQuoteService";
import { dismissCommonOverlays } from "./helpers/overlays";
import {
  SKIP_HOSTED_CHECKOUT_AUTOMATED_PAYMENT,
  waitForStripeHostedCheckout,
} from "./helpers/stripe-hosted-checkout";
import { BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT } from "@/lib/stripe/bnhubCheckoutConnectMode";

const BOOKING_CHECKOUT_ID = "seed-booking-pending-checkout";
const HOST_EMAIL = "host@demo.com";

async function ensureHostConnectAndPaymentQuote(): Promise<{ connectOk: boolean }> {
  await prisma.booking.updateMany({
    where: { id: BOOKING_CHECKOUT_ID },
    data: { status: "PENDING" },
  });
  await prisma.payment.updateMany({
    where: { bookingId: BOOKING_CHECKOUT_ID },
    data: { status: "PENDING", stripePaymentId: null, stripeCheckoutSessionId: null },
  });

  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!sk.startsWith("sk_test_")) {
    return { connectOk: false };
  }
  const host = await prisma.user.findUnique({
    where: { email: HOST_EMAIL },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });
  if (!host?.stripeAccountId) {
    const stripe = new Stripe(sk);
    try {
      const acct = await stripe.accounts.create({
        type: "express",
        country: "CA",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
      });
      await prisma.user.update({
        where: { email: HOST_EMAIL },
        data: { stripeAccountId: acct.id, stripeOnboardingComplete: true },
      });
    } catch {
      /* Connect not enabled — validateHostStripePayoutReadiness will fail probe */
    }
  }

  const hostAfter = await prisma.user.findUnique({
    where: { email: HOST_EMAIL },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });
  const readiness = await validateHostStripePayoutReadiness({
    stripeAccountId: hostAfter?.stripeAccountId,
    stripeOnboardingComplete: hostAfter?.stripeOnboardingComplete,
  });
  const connectOk = readiness.ok;

  if (connectOk) {
    const quote = await computeReservationQuoteFromBooking(BOOKING_CHECKOUT_ID);
    if (quote.ok) {
      const b = quote.breakdown;
      await prisma.payment.updateMany({
        where: { bookingId: BOOKING_CHECKOUT_ID },
        data: {
          amountCents: quote.grandTotalCents,
          guestFeeCents: b.serviceFeeCents,
          hostFeeCents: b.hostFeeCents,
        },
      });
    }
  }

  await prisma.bnhubReservationPayment.deleteMany({ where: { bookingId: BOOKING_CHECKOUT_ID } });

  return { connectOk };
}

test.describe("BNHub Stripe Checkout (browser)", () => {
  test.describe.configure({ timeout: 360_000 });

  test("documented skip: end-to-end hosted payment cannot be automated without PAN injection", () => {
    test.skip(true, SKIP_HOSTED_CHECKOUT_AUTOMATED_PAYMENT);
  });

  test("pay CTA opens Stripe-hosted Checkout (no card entry)", async ({ page, baseURL }) => {
    test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "STRIPE_SECRET_KEY sk_test_* required");
    test.skip(!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"), "STRIPE_WEBHOOK_SECRET required");

    const { connectOk } = await ensureHostConnectAndPaymentQuote();
    test.skip(
      !connectOk,
      "Stripe Connect is not enabled (or host Express account could not be created). Enable Connect in the Stripe Dashboard and ensure transfers work — otherwise hosted Checkout cannot be opened.",
    );

    const origin = baseURL ?? "http://127.0.0.1:3001";
    await page.goto(`${origin}/bnhub/login?next=${encodeURIComponent(`/bnhub/booking/${BOOKING_CHECKOUT_ID}`)}`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector('select[name="email"]', { state: "visible", timeout: 30_000 });
    await page.locator('select[name="email"]').selectOption("guest@demo.com");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(`**/bnhub/booking/${BOOKING_CHECKOUT_ID}`, { timeout: 30_000 });

    await dismissCommonOverlays(page);
    await page
      .getByRole("button", { name: /pay securely with stripe|complete demo payment|pay now|payer maintenant|stripe/i })
      .click({ timeout: 30_000 });

    await waitForStripeHostedCheckout(page);
  });

  test("shows host payout error when host has no Connect account", async ({ page, baseURL }) => {
    test.skip(
      BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT,
      "BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT — booking checkout bypasses host Connect gate; set false in lib/stripe/bnhubCheckoutConnectMode.ts to assert this UI.",
    );
    test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "STRIPE_SECRET_KEY sk_test_* required");
    await prisma.user.update({
      where: { email: HOST_EMAIL },
      data: { stripeAccountId: null, stripeOnboardingComplete: false },
    });
    await prisma.booking.updateMany({
      where: { id: BOOKING_CHECKOUT_ID },
      data: { status: "PENDING" },
    });

    const origin = baseURL ?? "http://127.0.0.1:3001";
    await page.goto(`${origin}/bnhub/login?next=${encodeURIComponent(`/bnhub/booking/${BOOKING_CHECKOUT_ID}`)}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector('select[name="email"]', { state: "visible", timeout: 30_000 });
    await page.locator('select[name="email"]').selectOption("guest@demo.com");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(`**/bnhub/booking/${BOOKING_CHECKOUT_ID}`, { timeout: 30_000 });
    await dismissCommonOverlays(page);
    await page
      .getByRole("button", { name: /pay securely with stripe|complete demo payment|pay now|payer maintenant|stripe/i })
      .click({ timeout: 30_000 });
    await expect(
      page.getByText(/Host payout is not configured yet\. Booking checkout is temporarily unavailable/i)
    ).toBeVisible({ timeout: 20_000 });
  });
});
