/**
 * LECIPM Launch Fix System v1 — real Stripe test-mode BNHub booking E2E.
 *
 * Uses the same `createCheckoutSession` path as POST /api/stripe/checkout (no browser cookie required),
 * then posts a signed `checkout.session.completed` payload to the running Next app — same as production.
 *
 * Requires: DATABASE_URL, STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_*, Next server reachable.
 */
import Stripe from "stripe";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { computeReservationQuoteFromBooking } from "@/modules/bnhub-payments/services/paymentQuoteService";
import {
  attachCheckoutSessionToReservationPayment,
  prepareReservationPaymentForCheckout,
} from "@/modules/bnhub-payments/services/paymentService";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import { verifyBookingIntegrity } from "@/modules/bookings/booking-integrity.service";

export type StripeBookingE2eResult = {
  success: boolean;
  bookingId: string | null;
  paymentIntentId: string | null;
  /** Second identical webhook returned duplicate skip — no double platform payment. */
  duplicateDetected: boolean;
  errors: string[];
  steps: { name: string; ok: boolean; detail?: string }[];
};

const BASE = process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() || "http://127.0.0.1:3001";

function record(
  steps: StripeBookingE2eResult["steps"],
  name: string,
  ok: boolean,
  detail?: string
): void {
  steps.push({ name, ok, detail });
}

async function postSignedWebhook(stripe: Stripe, payload: object, baseUrl: string): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });
  return fetch(`${baseUrl.replace(/\/$/, "")}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": header },
    body,
  });
}

async function cleanupE2eEntities(bookingId: string, listingId: string, hostId: string, guestId: string, eventId: string) {
  await prisma.bnhubProcessorWebhookInbox.deleteMany({ where: { eventId } }).catch(() => {});
  await prisma.stripeLedgerEntry.deleteMany({ where: { platformPayment: { bookingId } } }).catch(() => {});
  await prisma.platformPayment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingInvoice.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubMarketplacePaymentEvent.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubFinancialLedgerEntry.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubHostPayoutRecord.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubReservationPayment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubPaymentQuote.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.bnhubBookingGuarantee.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.platformCommissionRecord.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.payment.deleteMany({ where: { bookingId } }).catch(() => {});
  await prisma.booking.delete({ where: { id: bookingId } }).catch(() => {});
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId } }).catch(() => {});
  await prisma.shortTermListing.delete({ where: { id: listingId } }).catch(() => {});
  await prisma.user.delete({ where: { id: hostId } }).catch(() => {});
  await prisma.user.delete({ where: { id: guestId } }).catch(() => {});
}

export type RunStripeBookingE2eOptions = {
  baseUrl?: string;
  /** If true, leaves DB rows for inspection (no cleanup). */
  skipCleanup?: boolean;
  /** Post the same checkout.session.completed twice to verify idempotent webhook handling. */
  testDuplicateWebhook?: boolean;
};

/**
 * End-to-end: create listing + booking + Payment, `createCheckoutSession` (same core as /api/stripe/checkout),
 * synthetic paid session + signed webhook, verify DB + optional duplicate webhook.
 */
export async function runStripeBookingE2e(opts: RunStripeBookingE2eOptions = {}): Promise<StripeBookingE2eResult> {
  const steps: StripeBookingE2eResult["steps"] = [];
  const errors: string[] = [];
  const base = opts.baseUrl?.trim() || BASE;
  const runId = `e2e-${Date.now()}`;
  let duplicateDetected = false;
  let bookingId: string | null = null;
  let paymentIntentId: string | null = null;

  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!sk.startsWith("sk_test_")) {
    record(steps, "stripe_test_secret", false, "STRIPE_SECRET_KEY must be sk_test_…");
    errors.push("STRIPE_SECRET_KEY must be sk_test_…");
    return {
      success: false,
      bookingId: null,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  if (!whsec.startsWith("whsec_")) {
    record(steps, "stripe_webhook_secret", false, "STRIPE_WEBHOOK_SECRET must be whsec_…");
    errors.push("STRIPE_WEBHOOK_SECRET must be whsec_…");
    return {
      success: false,
      bookingId: null,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "stripe_test_secret", true);
  record(steps, "stripe_webhook_secret", true);

  const ping = await fetch(`${base.replace(/\/$/, "")}/robots.txt`, { method: "GET" }).catch(() => null);
  if (!ping || ping.status >= 500) {
    record(steps, "next_server_reachable", false, `Cannot reach ${base}`);
    errors.push(`Next server not reachable at ${base}`);
    return {
      success: false,
      bookingId: null,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "next_server_reachable", true, base);

  const stripe = new Stripe(sk);
  const hostEmail = `launch.host.${runId}@local.test`;
  const guestEmail = `launch.guest.${runId}@local.test`;

  const host = await prisma.user.create({
    data: {
      email: hostEmail,
      name: "Launch E2E Host",
      role: PlatformRole.HOST,
      emailVerifiedAt: new Date(),
    },
  });
  const guest = await prisma.user.create({
    data: {
      email: guestEmail,
      name: "Launch E2E Guest",
      role: PlatformRole.USER,
      emailVerifiedAt: new Date(),
    },
  });

  const listing = await prisma.shortTermListing.create({
    data: {
      listingCode: `LST-${runId}`,
      title: `Launch E2E ${runId}`,
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
      url: `https://example.com/launch-e2e-${runId}.jpg`,
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
  bookingId = booking.id;

  const quote = await computeReservationQuoteFromBooking(booking.id);
  if (!quote.ok) {
    record(steps, "pricing_quote", false, quote.error);
    errors.push(quote.error);
    await cleanupE2eEntities(booking.id, listing.id, host.id, guest.id, `evt_${runId}_noop`);
    return {
      success: false,
      bookingId,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "pricing_quote", true, `grandTotalCents=${quote.grandTotalCents}`);

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
    record(steps, "prepare_marketplace_checkout", false, prep.error);
    errors.push(prep.error);
    await cleanupE2eEntities(booking.id, listing.id, host.id, guest.id, `evt_${runId}_noop`);
    return {
      success: false,
      bookingId,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "prepare_marketplace_checkout", true, prep.reservationPaymentId);

  const appBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || base.replace(/\/$/, "");
  const successUrl = `${appBase}/bnhub/booking-success?booking_id=${encodeURIComponent(booking.id)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${appBase}/bnhub/booking-cancel?booking_id=${encodeURIComponent(booking.id)}`;

  const bookingHostSnapshot = await prisma.booking.findUnique({
    where: { id: booking.id },
    select: {
      listingId: true,
      listing: {
        select: {
          owner: { select: { id: true } },
        },
      },
    },
  });
  const hostOwnerId = bookingHostSnapshot?.listing?.owner?.id?.trim();
  const marketplaceCheckoutMetadata: Record<string, string> = {
    bnhubReservationPaymentId: prep.reservationPaymentId,
  };
  const market = await getResolvedMarket();
  const bnhubStripeMetadata: Record<string, string> = hostOwnerId
    ? {
        flow: "bnhub_booking",
        payoutMethod: resolveActivePaymentModeFromMarket(market) === "manual" ? "manual" : "stripe_connect",
        hostUserId: hostOwnerId,
      }
    : {};

  const cs = await createCheckoutSession({
    successUrl,
    cancelUrl,
    amountCents: quote.grandTotalCents,
    currency: "cad",
    paymentType: "booking",
    userId: guest.id,
    listingId: booking.listingId,
    bookingId: booking.id,
    metadata:
      Object.keys({ ...marketplaceCheckoutMetadata, ...bnhubStripeMetadata }).length > 0
        ? { ...marketplaceCheckoutMetadata, ...bnhubStripeMetadata }
        : undefined,
  });

  if ("error" in cs) {
    record(steps, "createCheckoutSession", false, cs.error);
    errors.push(cs.error);
    await cleanupE2eEntities(booking.id, listing.id, host.id, guest.id, `evt_${runId}_noop`);
    return {
      success: false,
      bookingId,
      paymentIntentId: null,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "createCheckoutSession", true, cs.sessionId);

  await attachCheckoutSessionToReservationPayment(prep.reservationPaymentId, cs.sessionId);
  await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { stripeCheckoutSessionId: cs.sessionId },
  });
  record(steps, "checkout_session_persisted", true);

  const sessionShell = await stripe.checkout.sessions.retrieve(cs.sessionId, {
    expand: ["payment_intent"],
  });
  const piFromSession = (() => {
    const pi = sessionShell.payment_intent;
    if (typeof pi === "string") return pi;
    if (pi && typeof pi === "object" && "id" in pi) return (pi as Stripe.PaymentIntent).id;
    return null;
  })();
  paymentIntentId = piFromSession;

  const baseMetadata: Record<string, string> = {
    userId: guest.id,
    paymentType: "booking",
    listingId: listing.id,
    bookingId: booking.id,
    bnhubReservationPaymentId: prep.reservationPaymentId,
  };

  const sessionPaid = {
    ...sessionShell,
    payment_status: "paid",
    amount_total: quote.grandTotalCents,
    currency: "cad",
    metadata: { ...(sessionShell.metadata ?? {}), ...baseMetadata },
    payment_intent: piFromSession ?? undefined,
  } as unknown as Stripe.Checkout.Session;

  const eventId = `evt_launch_${runId}_complete`;
  const completedEvent = {
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: { object: sessionPaid as unknown as Stripe.Checkout.Session },
    api_version: "2024-11-20.acacia",
  };

  const whRes = await postSignedWebhook(stripe, completedEvent, base);
  const whJson = (await whRes.json().catch(() => ({}))) as { duplicate?: boolean; received?: boolean };
  if (!whRes.ok) {
    record(steps, "webhook_checkout_completed", false, `HTTP ${whRes.status} ${JSON.stringify(whJson)}`);
    errors.push(`webhook failed: ${whRes.status}`);
    await cleanupE2eEntities(booking.id, listing.id, host.id, guest.id, eventId);
    return {
      success: false,
      bookingId,
      paymentIntentId,
      duplicateDetected: false,
      errors,
      steps,
    };
  }
  record(steps, "webhook_checkout_completed", true);

  const ppCountAfterFirst = await prisma.platformPayment.count({ where: { bookingId: booking.id } });
  if (ppCountAfterFirst !== 1) {
    record(steps, "platform_payment_created", false, `expected 1 platformPayment after first webhook, got ${ppCountAfterFirst}`);
    errors.push(`platform_payment_count=${ppCountAfterFirst}`);
  } else {
    record(steps, "platform_payment_created", true);
  }

  if (opts.testDuplicateWebhook !== false) {
    const whRes2 = await postSignedWebhook(stripe, completedEvent, base);
    const whJson2 = (await whRes2.json().catch(() => ({}))) as { duplicate?: boolean };
    duplicateDetected = whJson2.duplicate === true;
    if (!whRes2.ok) {
      record(steps, "webhook_duplicate_post", false, String(whRes2.status));
      errors.push("duplicate webhook post failed");
    } else {
      record(steps, "webhook_duplicate_post", true, JSON.stringify(whJson2).slice(0, 200));
    }
    const ppCountAfterSecond = await prisma.platformPayment.count({ where: { bookingId: booking.id } });
    if (ppCountAfterSecond !== ppCountAfterFirst || ppCountAfterSecond !== 1) {
      record(steps, "idempotency_platform_payment_count", false, `count=${ppCountAfterSecond}`);
      errors.push(`expected 1 platformPayment, got ${ppCountAfterSecond}`);
    } else {
      record(steps, "idempotency_platform_payment_count", true, "1 row");
    }
    if (!duplicateDetected) {
      errors.push("second_webhook_should_return_duplicate_true");
      record(steps, "webhook_duplicate_flag", false);
    } else {
      record(steps, "webhook_duplicate_flag", true);
    }
  }

  const bookingAfter = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: { payment: true, bnhubReservationPayment: true },
  });
  const payOk =
    bookingAfter?.status === "CONFIRMED" &&
    bookingAfter.payment?.status === "COMPLETED" &&
    bookingAfter.payment.amountCents === quote.grandTotalCents &&
    Boolean(bookingAfter.payment.stripePaymentId?.trim());

  record(steps, "db_booking_confirmed", !!payOk, payOk ? undefined : JSON.stringify(bookingAfter));
  if (!payOk) {
    errors.push("booking or payment not confirmed after webhook");
  }

  const integrity = await verifyBookingIntegrity(booking.id);
  record(steps, "booking_integrity", integrity.ok, integrity.ok ? undefined : (integrity as { issues: string[] }).issues.join(","));
  if (!integrity.ok) {
    errors.push(...(integrity as { issues: string[] }).issues);
  }

  const resolvedPaymentIntentId =
    bookingAfter?.payment?.stripePaymentId?.trim() ?? paymentIntentId ?? null;

  if (!opts.skipCleanup) {
    await cleanupE2eEntities(booking.id, listing.id, host.id, guest.id, eventId);
    bookingId = null;
  }

  const success = errors.length === 0 && !!payOk && integrity.ok;
  return {
    success,
    bookingId: opts.skipCleanup ? booking.id : bookingId,
    paymentIntentId: opts.skipCleanup ? resolvedPaymentIntentId : null,
    duplicateDetected,
    errors,
    steps,
  };
}
