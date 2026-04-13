/**
 * Real BNHUB booking → Stripe Checkout Session → signed checkout.session.completed webhook.
 * Adapted from scripts/validate-bnhub-stripe-e2e.ts (no PAN; uses Stripe test API + app webhook).
 */
import Stripe from "stripe";
import { PlatformRole } from "@prisma/client";
import { prisma } from "../../../lib/db";
import { computeReservationQuoteFromBooking } from "../../../modules/bnhub-payments/services/paymentQuoteService";
import { prepareReservationPaymentForCheckout } from "../../../modules/bnhub-payments/services/paymentService";
import { bnhubBookingFeeSplitCents, bnhubStripeApplicationFeeCents } from "../../../lib/stripe/bnhub-connect";
import { e2eStep } from "../_log";

const BASE = () => process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

async function postSignedWebhook(stripe: Stripe, payload: object): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return fetch(`${BASE()}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": header },
    body,
  });
}

function buildSessionParams(args: {
  grandTotalCents: number;
  guestEmail: string;
  runId: string;
  baseMetadata: Record<string, string>;
  connectAccountId: string | null;
  appFee: number;
  includeConnect: boolean;
}): Stripe.Checkout.SessionCreateParams {
  const { grandTotalCents, guestEmail, runId, baseMetadata, connectAccountId, appFee, includeConnect } = args;
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
          product_data: { name: `E2E scenario stay ${runId}` },
        },
        quantity: 1,
      },
    ],
    success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://example.com/cancel",
    metadata: { ...(useDest ? { connectDestination: connectAccountId! } : {}), ...baseMetadata },
  };
  if (useDest) {
    p.payment_intent_data = {
      application_fee_amount: appFee,
      transfer_data: { destination: connectAccountId! },
      metadata: baseMetadata,
    };
  } else {
    p.payment_intent_data = { metadata: baseMetadata };
  }
  return p;
}

export type BnhubStripePaidFlowResult =
  | { ok: true; bookingId: string; sessionId: string; paymentIntentId: string | null }
  | { ok: false; reason: string };

export async function runBnhubStripePaidSimulation(runId: string): Promise<BnhubStripePaidFlowResult> {
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!sk.startsWith("sk_test_")) return { ok: false, reason: "STRIPE_SECRET_KEY must be sk_test_*" };
  if (!whsec.startsWith("whsec_")) return { ok: false, reason: "STRIPE_WEBHOOK_SECRET must be whsec_*" };

  e2eStep("stripe_simulation_start", { runId });

  const stripe = new Stripe(sk);
  const hostEmail = `e2e.scen1.host.${runId}@local.test`;
  const guestEmail = `e2e.scen1.guest.${runId}@local.test`;

  const host = await prisma.user.create({
    data: {
      email: hostEmail,
      name: "E2E Scenario Host",
      role: PlatformRole.HOST,
      emailVerifiedAt: new Date(),
    },
  });
  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      name: "E2E Scenario Guest",
      role: PlatformRole.USER,
      emailVerifiedAt: new Date(),
    },
  });

  const listing = await prisma.shortTermListing.create({
    data: {
      listingCode: `LST-S1-${runId}`,
      title: `E2E Scenario 1 ${runId}`,
      address: "100 E2E Rue",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 10_000,
      currency: "cad",
      beds: 1,
      baths: 1,
      maxGuests: 4,
      cleaningFeeCents: 2000,
      securityDepositCents: 0,
      ownerId: host.id,
      listingStatus: "PUBLISHED",
      verificationStatus: "VERIFIED",
      instantBookEnabled: true,
      photos: [],
    },
  });

  await prisma.bnhubListingPhoto.create({
    data: {
      listingId: listing.id,
      url: `https://example.com/e2e-s1-${runId}.jpg`,
      sortOrder: 0,
      isCover: true,
    },
  });

  const checkIn = new Date();
  checkIn.setUTCDate(checkIn.getUTCDate() + 28);
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
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    return { ok: false, reason: `quote: ${quote.error}` };
  }

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
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    return { ok: false, reason: `prepare checkout: ${prep.error}` };
  }

  const split = bnhubBookingFeeSplitCents(quote.grandTotalCents);
  const appFee = bnhubStripeApplicationFeeCents(quote.grandTotalCents);

  let connectAccountId: string | null = null;
  try {
    const acct = await stripe.accounts.create({
      type: "express",
      country: "CA",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: "individual",
    });
    connectAccountId = acct.id;
    await prisma.user.update({
      where: { id: host.id },
      data: { stripeAccountId: connectAccountId, stripeOnboardingComplete: true },
    });
  } catch {
    /* Connect may be disabled — fall back below */
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
      buildSessionParams({
        grandTotalCents: quote.grandTotalCents,
        guestEmail,
        runId,
        baseMetadata,
        connectAccountId,
        appFee,
        includeConnect: !!connectAccountId,
      }),
    );
  } catch {
    session = await stripe.checkout.sessions.create(
      buildSessionParams({
        grandTotalCents: quote.grandTotalCents,
        guestEmail,
        runId,
        baseMetadata,
        connectAccountId,
        appFee,
        includeConnect: false,
      }),
    );
  }

  e2eStep("stripe_checkout_session_created", { sessionId: session.id, bookingId: booking.id });

  const sessionShell = await stripe.checkout.sessions.retrieve(session.id, { expand: ["payment_intent"] });
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

  const completedEvent = {
    id: `evt_e2e_s1_${runId}`,
    object: "event",
    type: "checkout.session.completed",
    data: { object: sessionPaid },
    api_version: "2024-11-20.acacia",
  };

  const whRes = await postSignedWebhook(stripe, completedEvent);
  const whText = await whRes.text();
  if (!whRes.ok) {
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    return { ok: false, reason: `webhook HTTP ${whRes.status}: ${whText.slice(0, 400)}` };
  }

  e2eStep("stripe_webhook_posted", { status: whRes.status });

  let confirmed = false;
  for (let i = 0; i < 40; i++) {
    const row = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (row?.status === "CONFIRMED") {
      confirmed = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const pay = await prisma.payment.findFirst({
    where: { bookingId: booking.id },
    select: { status: true, stripeCheckoutSessionId: true, stripePaymentId: true },
  });

  const ok = confirmed && pay?.status === "COMPLETED" && !!pay.stripeCheckoutSessionId;

  if (!ok) {
    await cleanup(booking.id, listing.id, host.id, guest.id, runId);
    return {
      ok: false,
      reason: `DB not confirmed: booking=${confirmed} payment=${pay?.status} session=${pay?.stripeCheckoutSessionId ?? "none"}`,
    };
  }

  e2eStep("stripe_simulation_verified_db", { bookingId: booking.id });

  await cleanup(booking.id, listing.id, host.id, guest.id, runId);
  return {
    ok: true,
    bookingId: booking.id,
    sessionId: session.id,
    paymentIntentId: piFromSession,
  };
}

async function cleanup(bookingId: string, listingId: string, hostId: string, guestId: string, runId: string) {
  await prisma.bnhubProcessorWebhookInbox
    .deleteMany({ where: { eventId: `evt_e2e_s1_${runId}` } })
    .catch(() => {});
  await prisma.stripeLedgerEntry.deleteMany({ where: { platformPayment: { bookingId } } }).catch(() => {});
  await prisma.platformPayment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingInvoice.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubMarketplacePaymentEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubFinancialLedgerEntry.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubHostPayoutRecord.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bookingManualPaymentEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.payment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubReservationPayment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubPaymentQuote.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingGuarantee.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingService.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.availabilitySlot.deleteMany({ where: { bookedByBookingId: bookingId } }).catch(() => {});
  await prisma.booking.deleteMany({ where: { id: bookingId } }).catch(() => {});
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId } }).catch(() => {});
  await prisma.shortTermListing.deleteMany({ where: { id: listingId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [hostId, guestId] } } }).catch(() => {});
}
