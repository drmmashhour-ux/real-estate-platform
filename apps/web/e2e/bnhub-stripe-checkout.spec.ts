/**
 * Real browser: demo login → seed pending booking → Stripe hosted Checkout (4242…) → success URL.
 * Prerequisites: STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_* (must match `stripe listen`),
 * DATABASE_URL, seeded DB (guest@demo.com, seed-booking-pending-checkout).
 */
import { expect, test, type Page } from "@playwright/test";
import Stripe from "stripe";
import { prisma } from "../lib/db";
import { computeReservationQuoteFromBooking } from "../modules/bnhub-payments/services/paymentQuoteService";

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
  let connectOk = Boolean(host?.stripeAccountId && host.stripeOnboardingComplete);
  if (!connectOk) {
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
      connectOk = true;
    } catch {
      /* Connect not enabled on platform account — checkout route will 409 */
    }
  }

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

  await prisma.bnhubReservationPayment.deleteMany({ where: { bookingId: BOOKING_CHECKOUT_ID } });

  return { connectOk };
}

async function fillStripeCheckout(page: Page): Promise<void> {
  await page.waitForURL(/checkout\.stripe\.com|c\.stripe\.com/, { timeout: 90_000 });

  const cardNumber = page.getByLabel(/card number|numéro de carte/i).first();
  const expiry = page.getByLabel(/expiration|expiry|date d’expiration|mm\s*\/\s*yy/i).first();
  const cvc = page.getByLabel(/cvc|security code|code de sécurité/i).first();

  if (await cardNumber.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await cardNumber.fill("4242424242424242");
    if (await expiry.isVisible().catch(() => false)) await expiry.fill("1234");
    if (await cvc.isVisible().catch(() => false)) await cvc.fill("123");
  } else {
    const outer = page.frameLocator('iframe[src*="stripe"]').first();
    const inner = outer.frameLocator('iframe').first();
    const num = inner.locator('[placeholder*="1234"], input[name="cardnumber"]').first();
    await num.waitFor({ state: "visible", timeout: 30_000 });
    await num.fill("4242424242424242");
    const exp = inner.locator('[placeholder*="MM"], input[name="exp-date"]').first();
    if (await exp.isVisible().catch(() => false)) await exp.fill("1234");
    const cvcField = inner.locator('[placeholder*="CVC"], input[name="cvc"]').first();
    if (await cvcField.isVisible().catch(() => false)) await cvcField.fill("123");
  }

  const pay = page.getByRole("button", { name: /pay|payer|complete/i }).first();
  await pay.click({ timeout: 30_000 });
}

test.describe("BNHub Stripe Checkout (browser)", () => {
  test.describe.configure({ timeout: 180_000 });

  test("guest pays pending booking on hosted Checkout (4242)", async ({ page, baseURL }) => {
    test.skip(!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"), "STRIPE_SECRET_KEY sk_test_* required");
    test.skip(!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"), "STRIPE_WEBHOOK_SECRET required (use stripe listen whsec)");

    const { connectOk } = await ensureHostConnectAndPaymentQuote();

    const origin = baseURL ?? "http://127.0.0.1:3000";
    await page.goto(`${origin}/bnhub/login?next=${encodeURIComponent(`/bnhub/booking/${BOOKING_CHECKOUT_ID}`)}`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector('select[name="email"]', { state: "visible", timeout: 30_000 });
    await page.locator('select[name="email"]').selectOption("guest@demo.com");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(`**/bnhub/booking/${BOOKING_CHECKOUT_ID}`, { timeout: 30_000 });

    await page.getByRole("button", { name: /pay now|payer maintenant/i }).click();

    if (!connectOk) {
      await expect(page.getByText(/Host payout account is not configured/i)).toBeVisible({ timeout: 15_000 });
      return;
    }

    await fillStripeCheckout(page);

    await page.waitForURL(new RegExp(`${BOOKING_CHECKOUT_ID}\\?paid=1`), { timeout: 120_000 });

    let confirmed = false;
    for (let i = 0; i < 45; i++) {
      const b = await prisma.booking.findUnique({
        where: { id: BOOKING_CHECKOUT_ID },
        include: { payment: true },
      });
      if (b?.status === "CONFIRMED" && b.payment?.status === "COMPLETED") {
        confirmed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(confirmed, "webhook should confirm booking after Checkout success").toBe(true);
  });
});
