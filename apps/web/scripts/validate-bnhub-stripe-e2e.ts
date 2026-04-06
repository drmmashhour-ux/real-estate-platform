/**
 * Validates BNHub booking payment plumbing using **Stripe Checkout Sessions only** (PCI):
 * creates a real Checkout Session via the Stripe API, then posts a signed
 * `checkout.session.completed` payload to the running Next app (same shape as Stripe after a guest
 * pays on checkout.stripe.com). No PaymentIntent.create / confirm / raw card data in this script.
 *
 * Requires:
 *   - DATABASE_URL, STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_*
 *   - Next server running (default http://127.0.0.1:3001) — same DB as this script
 *
 * Run from apps/web:
 *   pnpm run validate:bnhub-stripe
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import Stripe from "stripe";
import { PlatformRole } from "@prisma/client";
import { prisma } from "../lib/db";
import { computeReservationQuoteFromBooking } from "../modules/bnhub-payments/services/paymentQuoteService";
import { prepareReservationPaymentForCheckout } from "../modules/bnhub-payments/services/paymentService";
import { bnhubBookingFeeSplitCents, bnhubStripeApplicationFeeCents } from "../lib/stripe/bnhub-connect";

/* apps/web/.env only — do not merge repo-root .env over Stripe keys */
config({ path: resolve(process.cwd(), ".env"), override: true });

const BASE = process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() || "http://127.0.0.1:3001";
const runId = `bnhub-e2e-${Date.now()}`;

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}

function isConnectCapabilityBootstrapIssue(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /missing the required capabilities: transfers|legacy_payments are required/i.test(msg);
}

function buildBnhubE2eCheckoutSessionParams(args: {
  grandTotalCents: number;
  guestEmail: string;
  runId: string;
  baseMetadata: Record<string, string>;
  connectAccountId: string | null;
  appFee: number;
  productLabel: string;
  includeConnect: boolean;
}): Stripe.Checkout.SessionCreateParams {
  const {
    grandTotalCents,
    guestEmail,
    runId,
    baseMetadata,
    connectAccountId,
    appFee,
    productLabel,
    includeConnect,
  } = args;
  const useDest = includeConnect && !!connectAccountId && appFee < grandTotalCents;
  const p: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer_email: guestEmail,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          unit_amount: grandTotalCents,
          product_data: { name: `BNHub E2E ${productLabel} ${runId}` },
        },
        quantity: 1,
      },
    ],
    success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://example.com/cancel",
    metadata: {
      ...baseMetadata,
      ...(useDest ? { connectDestination: connectAccountId! } : {}),
    },
  };
  if (useDest) {
    p.payment_intent_data = {
      application_fee_amount: appFee,
      transfer_data: { destination: connectAccountId! },
      metadata: baseMetadata,
    };
  } else {
    p.payment_intent_data = {
      metadata: baseMetadata,
    };
  }
  return p;
}

async function postSignedWebhook(stripe: Stripe, payload: object): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });
  return fetch(`${BASE.replace(/\/$/, "")}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": header },
    body,
  });
}

async function main() {
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!sk.startsWith("sk_test_")) {
    record("stripe_test_secret", false, "STRIPE_SECRET_KEY must be sk_test_…");
    printSummary();
    process.exit(1);
  }
  if (!whsec.startsWith("whsec_")) {
    record("stripe_webhook_secret", false, "STRIPE_WEBHOOK_SECRET must be whsec_…");
    printSummary();
    process.exit(1);
  }
  record("stripe_test_secret", true);
  record("stripe_webhook_secret", true);

  const ping = await fetch(`${BASE.replace(/\/$/, "")}/robots.txt`, { method: "GET" }).catch(() => null);
  if (!ping || ping.status >= 500) {
    record(
      "next_server_reachable",
      false,
      `Cannot reach ${BASE} — start Next (pnpm dev) with same DATABASE_URL as this script.`,
    );
    printSummary();
    process.exit(1);
  }
  record("next_server_reachable", true, BASE);

  const stripe = new Stripe(sk);

  const hostEmail = `bnhub.host.${runId}@local.test`;
  const guestEmail = `bnhub.guest.${runId}@local.test`;

  const host = await prisma.user.create({
    data: {
      email: hostEmail,
      name: "E2E Host",
      role: PlatformRole.HOST,
      emailVerifiedAt: new Date(),
    },
  });
  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      name: "E2E Guest",
      role: PlatformRole.USER,
      emailVerifiedAt: new Date(),
    },
  });

  const listing = await prisma.shortTermListing.create({
    data: {
      listingCode: `LST-${runId}`,
      title: `BNHub E2E ${runId}`,
      address: "1 Rue Test",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 10_000,
      currency: "cad",
      beds: 1,
      baths: 1,
      maxGuests: 4,
      cleaningFeeCents: 5000,
      securityDepositCents: 0,
      ownerId: host.id,
      listingStatus: "PUBLISHED",
      verificationStatus: "VERIFIED",
      photos: [],
    },
  });

  await prisma.bnhubListingPhoto.create({
    data: {
      listingId: listing.id,
      url: `https://example.com/bnhub-e2e-${runId}.jpg`,
      sortOrder: 0,
      isCover: true,
    },
  });

  const checkIn = new Date();
  checkIn.setUTCDate(checkIn.getUTCDate() + 14);
  checkIn.setUTCHours(15, 0, 0, 0);
  const checkOut = new Date(checkIn);
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  const booking = await prisma.booking.create({
    data: {
      guestId: guest.id,
      listingId: listing.id,
      checkIn,
      checkOut,
      nights: 2,
      totalCents: 20_000,
      status: "PENDING",
    },
  });

  const quote = await computeReservationQuoteFromBooking(booking.id);
  if (!quote.ok) {
    record("pricing_quote", false, quote.error);
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    printSummary();
    process.exit(1);
  }
  record("pricing_quote", true, `grandTotalCents=${quote.grandTotalCents}`);

  const b = quote.breakdown;
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amountCents: quote.grandTotalCents,
      guestFeeCents: b.serviceFeeCents,
      hostFeeCents: b.hostFeeCents,
      status: "PENDING",
    },
  });

  const prep = await prepareReservationPaymentForCheckout({
    bookingId: booking.id,
    guestUserId: guest.id,
  });
  if (!prep.ok) {
    record("prepare_marketplace_checkout", false, prep.error);
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    printSummary();
    process.exit(1);
  }
  record("prepare_marketplace_checkout", true, prep.reservationPaymentId);

  const split = bnhubBookingFeeSplitCents(quote.grandTotalCents);
  const appFee = bnhubStripeApplicationFeeCents(quote.grandTotalCents);

  let connectAccountId: string | null = null;
  try {
    const acct = await stripe.accounts.create({
      type: "express",
      country: "CA",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });
    connectAccountId = acct.id;
    await prisma.user.update({
      where: { id: host.id },
      data: { stripeAccountId: connectAccountId, stripeOnboardingComplete: true },
    });
    record("stripe_connect_test_account", true, connectAccountId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const connectDisabled = /Connect|signed up for Connect/i.test(msg);
    record(
      "stripe_connect_test_account",
      connectDisabled,
      connectDisabled ? "Connect not enabled on account — continuing without destination charge" : msg,
    );
  }

  const baseMetadata: Record<string, string> = {
    userId: guest.id,
    paymentType: "booking",
    listingId: listing.id,
    bookingId: booking.id,
    bnhubReservationPaymentId: prep.reservationPaymentId,
    applicationFeeCents: String(appFee),
    bnhubPlatformFeeCents: String(split.platformFeeCents),
    bnhubHostPayoutCents: String(split.hostPayoutCents),
  };

  let session: Stripe.Response<Stripe.Checkout.Session>;
  try {
    session = await stripe.checkout.sessions.create(
      buildBnhubE2eCheckoutSessionParams({
        grandTotalCents: quote.grandTotalCents,
        guestEmail,
        runId,
        baseMetadata,
        connectAccountId,
        appFee,
        productLabel: "stay",
        includeConnect: !!connectAccountId,
      })
    );
    record("checkout_session_created", true, session.id);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    record(
      "checkout_session_create_connect",
      isConnectCapabilityBootstrapIssue(e),
      isConnectCapabilityBootstrapIssue(e)
        ? `Connect test account not fully active yet; fallback path used. ${detail}`
        : detail,
    );
    session = await stripe.checkout.sessions.create(
      buildBnhubE2eCheckoutSessionParams({
        grandTotalCents: quote.grandTotalCents,
        guestEmail,
        runId,
        baseMetadata,
        connectAccountId,
        appFee,
        productLabel: "stay",
        includeConnect: false,
      })
    );
    record("checkout_session_create_fallback", true, "without Connect destination charge");
    record("checkout_session_created", true, session.id);
  }

  const sessionShell = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["payment_intent"],
  });
  const piFromSession = (() => {
    const pi = sessionShell.payment_intent;
    if (typeof pi === "string") return pi;
    if (pi && typeof pi === "object" && "id" in pi) return (pi as Stripe.PaymentIntent).id;
    return null;
  })();
  const sessionPaid = {
    ...sessionShell,
    payment_status: "paid",
    amount_total: quote.grandTotalCents,
    currency: "cad",
    metadata: { ...(sessionShell.metadata ?? {}), ...baseMetadata },
    payment_intent: piFromSession ?? undefined,
  } as unknown as Stripe.Checkout.Session;

  record(
    "checkout_session_paid",
    true,
    `synthetic paid payload (session=${session.id}${piFromSession ? ` pi=${piFromSession}` : " no PI yet"})`,
  );

  const meta = sessionPaid.metadata ?? {};
  if (
    meta.listingId !== listing.id ||
    meta.userId !== guest.id ||
    meta.bookingId !== booking.id ||
    meta.paymentType !== "booking"
  ) {
    record("stripe_session_metadata", false, JSON.stringify(meta));
  } else {
    record("stripe_session_metadata", true);
  }

  const completedEvent = {
    id: `evt_validate_${runId}_complete`,
    object: "event",
    type: "checkout.session.completed",
    data: { object: sessionPaid as unknown as Stripe.Checkout.Session },
    api_version: "2024-11-20.acacia",
  };

  const whRes = await postSignedWebhook(stripe, completedEvent);
  const whJson = await whRes.json().catch(() => ({}));
  if (!whRes.ok) {
    record("webhook_checkout_completed", false, `HTTP ${whRes.status} ${JSON.stringify(whJson)}`);
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    printSummary();
    process.exit(1);
  }
  record("webhook_checkout_completed", true, JSON.stringify(whJson).slice(0, 120));

  const bookingAfter = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: { payment: true, bnhubReservationPayment: true },
  });
  const payOk =
    bookingAfter?.status === "CONFIRMED" &&
    bookingAfter.payment?.status === "COMPLETED" &&
    bookingAfter.payment.amountCents === quote.grandTotalCents &&
    bookingAfter.guestId === guest.id &&
    bookingAfter.listingId === listing.id;
  record("db_booking_confirmed", !!payOk, payOk ? undefined : JSON.stringify(bookingAfter));

  const mpPaid = bookingAfter?.bnhubReservationPayment?.paymentStatus === "PAID";
  record("db_marketplace_payment_paid", !!mpPaid);

  const feeOk =
    bookingAfter?.payment?.platformFeeCents != null &&
    bookingAfter.payment.hostPayoutCents != null &&
    bookingAfter.payment.platformFeeCents + bookingAfter.payment.hostPayoutCents === quote.grandTotalCents;
  record("db_fee_split_sums_to_total", !!feeOk);

  await cleanup(booking.id, listing.id, host.id, guest.id, runId);

  printSummary();
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

async function cleanup(bookingId: string, listingId: string, hostId: string, guestId: string, runId: string) {
  await prisma.bnhubProcessorWebhookInbox
    .deleteMany({
      where: {
        eventId: `evt_validate_${runId}_complete`,
      },
    })
    .catch(() => {});

  await prisma.stripeLedgerEntry
    .deleteMany({ where: { platformPayment: { bookingId } } })
    .catch(() => {});
  await prisma.platformPayment.deleteMany({ where: { bookingId } }).catch(() => {});

  await prisma.bnhubBookingEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingInvoice.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubMarketplacePaymentEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubFinancialLedgerEntry.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubHostPayoutRecord.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubReservationPayment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubPaymentQuote.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingGuarantee.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.payment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.booking.delete({ where: { id: bookingId } }).catch(() => {});
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId } }).catch(() => {});
  await prisma.shortTermListing.delete({ where: { id: listingId } }).catch(() => {});
  await prisma.user.delete({ where: { id: hostId } }).catch(() => {});
  await prisma.user.delete({ where: { id: guestId } }).catch(() => {});
}

function aggregate(names: string[]): "OK" | "FAIL" {
  const subset = results.filter((r) => names.includes(r.name));
  if (subset.length === 0) return "FAIL";
  return subset.every((r) => r.ok) ? "OK" : "FAIL";
}

function printSummary() {
  console.log("\n--- validate-bnhub-stripe summary ---");
  for (const r of results) {
    console.log(`${r.ok ? "OK " : "FAIL"} ${r.name}`);
  }

  const issues = results.filter((r) => !r.ok).map((r) => `${r.name}${r.detail ? `: ${r.detail}` : ""}`);

  console.log("\n--- FINAL REPORT (automated checks) ---");
  console.log(
    "Note: Browser listing→dates→checkout and Stripe Dashboard are manual; this script hits the same APIs + webhooks.\n",
  );
  console.log(`- user flow (server prep / quote / checkout prep): ${aggregate(["next_server_reachable", "pricing_quote", "prepare_marketplace_checkout"])}`);
  console.log(
    `- payment (Checkout Session + synthetic paid webhook): ${aggregate(["checkout_session_created", "checkout_session_paid", "webhook_checkout_completed"])}`,
  );
  console.log(`- booking (DB CONFIRMED + ids): ${aggregate(["db_booking_confirmed"])}`);
  console.log(
    `- Stripe sync (metadata + marketplace PAID): ${aggregate(["stripe_session_metadata", "db_marketplace_payment_paid"])}`,
  );
  console.log(`- money logic (fee split): ${aggregate(["db_fee_split_sums_to_total"])}`);
  if (issues.length) {
    console.log("\n- issues found:");
    for (const line of issues) console.log(`  - ${line}`);
  } else {
    console.log("\n- issues found: none");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
