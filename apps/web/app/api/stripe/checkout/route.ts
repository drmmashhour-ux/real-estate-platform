/**
 * POST /api/stripe/checkout – Create Stripe Checkout session.
 * Body: successUrl, cancelUrl, amountCents, currency?, paymentType, listingId?, projectId?, bookingId?, dealId?, brokerId?, description?
 * Returns: { url } or { error }. Only the Stripe webhook confirms paid/booking state — not success_url.
 *
 * LECIPM recurring SKUs (Stripe subscription mode): set Product/Price metadata so webhooks sync correctly:
 * - `lecipmHubKind`: `investor` | `residence_soins` | `family_premium` | `workspace` (default workspace SaaS)
 * - `paymentType`: e.g. `lecipm_workspace_subscription`, broker broker subscription uses `brokerLecipmSubscription` handlers
 * One-time: leads, FSBO, featured listing — use existing `paymentType` values matching `PlatformPayment.paymentType`.
 */

import { NextRequest } from "next/server";
import { resolveCheckoutUserId } from "@/lib/auth/resolve-checkout-user";
import { assertGuestCanCheckoutBooking } from "@/lib/bnhub/booking-checkout-guard";
import { createCheckoutSession, type CreateCheckoutParams, type PaymentType } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import {
  bnhubBookingFeeSplitCents,
  bnhubStripeApplicationFeeCents,
  getBnhubCommissionRate,
} from "@/lib/stripe/bnhub-connect";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordPlatformEvent } from "@/lib/observability";
import { prisma } from "@repo/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { getFsboPlanPublishPriceCents, parseFsboPublishPlan } from "@/lib/fsbo/constants";
import {
  attachCheckoutSessionToReservationPayment,
  prepareReservationPaymentForCheckout,
} from "@/modules/bnhub-payments/services/paymentService";
import { trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";
import { logInfo, logWarn } from "@/lib/logger";
import { stripeSecretBlockedInTestMode } from "@/lib/stripe/test-mode-stripe-guard";
import {
  BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE,
  validateHostStripePayoutReadiness,
} from "@/lib/stripe/hostPayoutReadiness";
import { onCheckoutStartAutomation } from "@/src/services/automation";
import { onMessagingTriggerCheckoutStarted } from "@/src/modules/messaging/triggers";
import { mergeTrafficAttributionIntoMetadata } from "@/lib/attribution/social-traffic";
import { recordInternalCrmEvent } from "@/lib/crm/internal-crm-telemetry";
import { BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT } from "@/lib/stripe/bnhubCheckoutConnectMode";
import { parseUpsellsFromBody } from "@/lib/monetization/bnhub-checkout-pricing";
import {
  createGuestSupabaseBookingCheckoutSession,
  isGuestSupabaseOnlyCheckoutBody,
} from "@/lib/stripe/guestSupabaseBooking";
import { getCountryBySlug } from "@/config/countries";
import { getResolvedMarket } from "@/lib/markets";
import { isStripeEnabledForCountry } from "@/lib/payments/stripe-by-country";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import { getRequestCountrySlug } from "@/lib/region/request-country";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import { bookingMoneyBreakdownFromPricingBreakdown } from "@/lib/bookings/money";
import { persistMoneyEvent } from "@/lib/payments/money-events";
import { assertNoRawCardDataInBody } from "@/lib/api/request-safety";

export const dynamic = "force-dynamic";

/** Allow Expo / app scheme returns for Supabase guest checkout; block arbitrary https origins. */
function isAllowedGuestSupabaseCheckoutRedirect(urlRaw: string): boolean {
  const url = urlRaw.trim();
  if (!url || url.length > 2048) return false;
  const testInput = url.includes("{CHECKOUT_SESSION_ID}")
    ? url.replace("{CHECKOUT_SESSION_ID}", "cs_test_placeholder")
    : url;
  try {
    const u = new URL(testInput);
    const proto = u.protocol.replace(":", "").toLowerCase();
    if (proto === "lecipm" || proto === "bnhubguest" || proto === "exp" || proto === "exps")
      return true;
    const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (app) {
      const normalized = app.replace(/\/$/, "");
      const base = new URL(normalized);
      if (u.origin === base.origin) return true;
    }
    if (proto === "http" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Alias for historical comments in this file — source: `bnhubCheckoutConnectMode.ts`. */
const TEMP_DISABLE_CONNECT = BNHUB_BOOKING_CHECKOUT_SKIPS_HOST_CONNECT;
const USE_ON_BEHALF_OF_FOR_BNHUB_BOOKINGS = process.env.STRIPE_CONNECT_USE_ON_BEHALF_OF === "1";

const PAYMENT_TYPES: PaymentType[] = [
  "booking",
  "subscription",
  "lead_unlock",
  "mortgage_contact_unlock",
  "deposit",
  "closing_fee",
  "featured_listing",
  "fsbo_publish",
];

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = checkRateLimit(`stripe:checkout:ip:${ip}`, { windowMs: 60 * 1000, max: 40 });
  if (!ipLimit.allowed) {
    return Response.json(
      { error: "Too many checkout requests from this network. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(ipLimit) }
    );
  }

  const requestCountrySlug = await getRequestCountrySlug();
  const requestCountryDef = getCountryBySlug(requestCountrySlug);
  if (!isStripeEnabledForCountry(requestCountryDef)) {
    return Response.json(
      {
        error:
          "Online card checkout is not available in this region. Use the manual or cash arrangement offered on the listing.",
      },
      { status: 403 }
    );
  }

  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Payments are not configured. Please try again later." },
      { status: 503 }
    );
  }

  const testStripeBlock = stripeSecretBlockedInTestMode();
  if (testStripeBlock) {
    logWarn("[checkout] blocked live Stripe in test mode");
    return Response.json({ error: testStripeBlock }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  /** Mobile guest BNHUB: Supabase `bookings` only — no LECIPM session; server loads amount from DB. */
  if (isGuestSupabaseOnlyCheckoutBody(body)) {
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const guestLimit = checkRateLimit(`stripe:guest-supabase-checkout:ip:${ip}`, { windowMs: 60_000, max: 30 });
    if (!guestLimit.allowed) {
      return Response.json(
        { error: "Too many checkout requests. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(guestLimit) }
      );
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    if (!appUrl) {
      return Response.json({ error: "NEXT_PUBLIC_APP_URL is not configured." }, { status: 500 });
    }
    const defaultSuccess = `${appUrl}/payment-success?bookingId=${encodeURIComponent(bookingId)}&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancel = `${appUrl}/payment-cancel?bookingId=${encodeURIComponent(bookingId)}`;
    const clientSuccess = typeof body.successUrl === "string" ? body.successUrl.trim() : "";
    const clientCancel = typeof body.cancelUrl === "string" ? body.cancelUrl.trim() : "";
    const successUrlGuest =
      clientSuccess && isAllowedGuestSupabaseCheckoutRedirect(clientSuccess) ? clientSuccess : defaultSuccess;
    const cancelUrlGuest =
      clientCancel && isAllowedGuestSupabaseCheckoutRedirect(clientCancel) ? clientCancel : defaultCancel;
    const guestResult = await createGuestSupabaseBookingCheckoutSession({
      bookingId,
      successUrl: successUrlGuest,
      cancelUrl: cancelUrlGuest,
      upsells: parseUpsellsFromBody(body),
    });
    if ("error" in guestResult) {
      logWarn("[bnhub] guest_checkout_start_failed", {
        bookingId,
        status: guestResult.status,
      });
      return Response.json({ error: guestResult.error }, { status: guestResult.status });
    }
    return Response.json({ success: true, url: guestResult.url, sessionId: guestResult.sessionId });
  }

  const userId = await resolveCheckoutUserId(request);
  if (userId) {
    const limit = checkRateLimit(`stripe:checkout:${userId}`, { windowMs: 60 * 1000, max: 20 });
    if (!limit.allowed) {
      return Response.json({ error: "Too many checkout requests. Try again in a minute." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
  }

  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const appBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  let successUrl = typeof body.successUrl === "string" ? body.successUrl.trim() : "";
  let cancelUrl = typeof body.cancelUrl === "string" ? body.cancelUrl.trim() : "";
  const rawPaymentType = typeof body.paymentType === "string" ? body.paymentType.trim() : "";
  const bookingIdForRedirects =
    typeof body.bookingId === "string" && body.bookingId.trim() ? body.bookingId.trim() : "";
  if (
    rawPaymentType === "booking" &&
    bookingIdForRedirects &&
    appBase &&
    (!successUrl || !cancelUrl)
  ) {
    successUrl = `${appBase}/bnhub/booking-success?booking_id=${encodeURIComponent(bookingIdForRedirects)}&session_id={CHECKOUT_SESSION_ID}`;
    cancelUrl = `${appBase}/bnhub/booking-cancel?booking_id=${encodeURIComponent(bookingIdForRedirects)}`;
    logInfo("[stripe/checkout] defaulted bnhub booking redirect URLs", { bookingId: bookingIdForRedirects });
  }

  if (rawPaymentType === "lecipm_workspace_subscription") {
    if (!successUrl || !cancelUrl) {
      return Response.json({ error: "successUrl and cancelUrl are required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) {
      return Response.json({ error: "User email required for subscription checkout" }, { status: 400 });
    }
    const { createWorkspaceCheckoutSession } = await import("@/modules/billing/createWorkspaceCheckoutSession");
    const result = await createWorkspaceCheckoutSession({
      userId,
      userEmail: user.email,
      successUrl,
      cancelUrl,
      priceId: typeof body.priceId === "string" ? body.priceId.trim() : undefined,
      lookupKey: typeof body.lookupKey === "string" ? body.lookupKey.trim() : undefined,
      planCode: typeof body.planCode === "string" ? body.planCode.trim() : undefined,
      workspaceId: typeof body.workspaceId === "string" ? body.workspaceId.trim() : undefined,
    });
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    captureServerEvent(userId, AnalyticsEvents.CHECKOUT_STARTED, {
      flow: "lecipm_workspace_subscription",
      planCode: typeof body.planCode === "string" ? body.planCode : null,
    });
    void trackEvent("checkout_started", { flow: "lecipm_workspace_subscription" }, { userId }).catch(() => {});
    void onCheckoutStartAutomation(userId, { flow: "workspace_subscription" }).catch(() => {});
    void onMessagingTriggerCheckoutStarted(userId).catch(() => {});
    void persistLaunchEvent("CHECKOUT_START", {
      userId,
      sessionId: result.sessionId,
      paymentType: "lecipm_workspace_subscription",
      amountCents: null,
      bookingId: null,
      listingId: null,
    });

    void recordEvolutionOutcome({
      domain: "LECIPM",
      metricType: "CONVERSION",
      strategyKey: "checkout_start",
      entityId: result.sessionId,
      entityType: "CheckoutSession",
      actualJson: {
        userId,
        paymentType: "lecipm_workspace_subscription",
      },
      reinforceStrategy: true,
      idempotent: false,
    }).catch(() => {});
    return Response.json({ success: true, url: result.url, sessionId: result.sessionId });
  }

  const amountCents = typeof body.amountCents === "number" ? body.amountCents : Number(body.amountCents);
  const paymentType = PAYMENT_TYPES.includes(body.paymentType as PaymentType) ? (body.paymentType as PaymentType) : null;

  if (!successUrl || !cancelUrl || !paymentType) {
    return Response.json(
      { error: "successUrl, cancelUrl, and paymentType are required" },
      { status: 400 }
    );
  }
  const bookingIdForAmount =
    paymentType === "booking" && typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (
    paymentType !== "fsbo_publish" &&
    paymentType !== "booking" &&
    (!Number.isFinite(amountCents) || amountCents < 1)
  ) {
    return Response.json(
      { error: "amountCents (positive) is required for this payment type" },
      { status: 400 }
    );
  }
  if (paymentType === "booking" && bookingIdForAmount && (!Number.isFinite(amountCents) || amountCents < 1)) {
    /** Amount loaded server-side from `assertGuestCanCheckoutBooking` below. */
  } else if (paymentType === "booking" && !bookingIdForAmount) {
    return Response.json({ error: "bookingId is required for booking payments" }, { status: 400 });
  }

  let chargeAmountCents =
    paymentType === "fsbo_publish" || paymentType === "booking" ? 0 : Math.round(amountCents);
  let connect: CreateCheckoutParams["connect"];
  let fsboListingId: string | undefined;

  if (paymentType === "fsbo_publish") {
    const fid = typeof body.fsboListingId === "string" ? body.fsboListingId.trim() : "";
    if (!fid) {
      return Response.json({ error: "fsboListingId is required for fsbo_publish" }, { status: 400 });
    }
    const listing = await prisma.fsboListing.findUnique({
      where: { id: fid },
      select: { ownerId: true, status: true },
    });
    if (!listing || listing.ownerId !== userId) {
      return Response.json({ error: "Listing not found or access denied" }, { status: 403 });
    }
    if (listing.status !== "DRAFT") {
      return Response.json({ error: "Only draft listings can be published for payment" }, { status: 409 });
    }
    const { assertFsboContractsSignedForActivation } = await import("@/lib/contracts/fsbo-seller-contracts");
    const contractGate = await assertFsboContractsSignedForActivation(fid);
    if (!contractGate.ok) {
      return Response.json(
        {
          error: "Sign the seller agreement and platform terms before checkout (Dashboard → Contracts).",
          code: "CONTRACTS_REQUIRED",
        },
        { status: 403 }
      );
    }
    const plan = parseFsboPublishPlan(body.fsboPlan);
    await prisma.fsboListing
      .update({
        where: { id: fid },
        data: { publishPlan: plan },
      })
      .catch(() => {});
    chargeAmountCents = getFsboPlanPublishPriceCents(plan);
    fsboListingId = fid;
  }

  let serverBookingListingId: string | undefined;
  let bookingHostSnapshot: {
    listingId: string;
    listing: { owner: { id: string; stripeAccountId: string | null; stripeOnboardingComplete: boolean } | null } | null;
  } | null = null;

  if (paymentType === "booking") {
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    if (!bookingId) {
      return Response.json({ error: "bookingId is required for booking payments" }, { status: 400 });
    }
    const gate = await assertGuestCanCheckoutBooking(bookingId, userId);
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: gate.httpStatus });
    }
    chargeAmountCents = gate.amountCents;

    bookingHostSnapshot = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        listingId: true,
        listing: {
          select: {
            owner: {
              select: {
                id: true,
                stripeAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
    });
    serverBookingListingId = bookingHostSnapshot?.listingId;
    const owner = bookingHostSnapshot?.listing?.owner;

    // TEMP_DISABLE_CONNECT — restore block below when TEMP_DISABLE_CONNECT is false
    if (!TEMP_DISABLE_CONNECT) {
      const payoutReadiness = await validateHostStripePayoutReadiness({
        stripeAccountId: owner?.stripeAccountId,
        stripeOnboardingComplete: owner?.stripeOnboardingComplete,
      });
      if (!payoutReadiness.ok) {
        const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
        logWarn("[bnhub][checkout] blocked — host payout / Connect not ready", {
          code: payoutReadiness.code,
          bookingId,
          detail: payoutReadiness.logDetail,
        });
        void persistLaunchEvent("CHECKOUT_BLOCKED", {
          code: BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE,
          detailCode: payoutReadiness.code,
          bookingId: bookingId || null,
          listingId: serverBookingListingId ?? null,
          userId,
          reason: payoutReadiness.logDetail,
        });
        return Response.json(
          {
            error: "Host payout not configured",
            code: BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE,
            detailCode: payoutReadiness.code,
          },
          { status: 409 }
        );
      }
      const split = bnhubBookingFeeSplitCents(chargeAmountCents);
      const applicationFeeAmount = bnhubStripeApplicationFeeCents(chargeAmountCents);
      if (applicationFeeAmount >= chargeAmountCents && chargeAmountCents > 0) {
        return Response.json(
          { error: "Invalid BNHUB fee split for Stripe Connect." },
          { status: 400 }
        );
      }
      const destinationAccountId = owner?.stripeAccountId;
      if (!destinationAccountId) {
        return Response.json(
          {
            error: "Host payout not configured",
            code: BNHUB_CHECKOUT_BLOCKED_RESPONSE_CODE,
            detailCode: "HOST_STRIPE_ACCOUNT_MISSING",
          },
          { status: 409 }
        );
      }
      connect = {
        destinationAccountId,
        applicationFeeAmount,
        ...(USE_ON_BEHALF_OF_FOR_BNHUB_BOOKINGS
          ? { onBehalfOfAccountId: destinationAccountId }
          : {}),
        bnhubPlatformFeeCents: split.platformFeeCents,
        bnhubHostPayoutCents: split.hostPayoutCents,
      };
    }
  }

  let marketplaceCheckoutMetadata: Record<string, string> = {};
  let bnhubStripeMetadata: Record<string, string> = {};
  if (paymentType === "booking" && typeof body.bookingId === "string" && body.bookingId) {
    const mp = await prepareReservationPaymentForCheckout({
      bookingId: body.bookingId.trim(),
      guestUserId: userId,
    });
    if (!mp.ok) {
      return Response.json({ error: mp.error }, { status: mp.httpStatus ?? 400 });
    }
    marketplaceCheckoutMetadata = { bnhubReservationPaymentId: mp.reservationPaymentId };
    const hostOwnerId = bookingHostSnapshot?.listing?.owner?.id?.trim();
    if (hostOwnerId) {
      const market = await getResolvedMarket();
      bnhubStripeMetadata = {
        flow: "bnhub_booking",
        payoutMethod: resolveActivePaymentModeFromMarket(market) === "manual" ? "manual" : "stripe_connect",
        hostUserId: hostOwnerId,
      };
    }
  }

  const fsboPlanForSession =
    paymentType === "fsbo_publish" ? parseFsboPublishPlan(body.fsboPlan) : undefined;

  const result = await createCheckoutSession({
    successUrl,
    cancelUrl,
    amountCents: chargeAmountCents,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    paymentType,
    userId,
    listingId:
      paymentType === "booking" && serverBookingListingId
        ? serverBookingListingId
        : typeof body.listingId === "string"
          ? body.listingId
          : undefined,
    projectId: typeof body.projectId === "string" ? body.projectId : undefined,
    bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
    dealId: typeof body.dealId === "string" ? body.dealId : undefined,
    brokerId: typeof body.brokerId === "string" ? body.brokerId : undefined,
    fsboListingId,
    fsboPlan: fsboPlanForSession,
    description:
      paymentType === "fsbo_publish"
        ? fsboPlanForSession === "premium"
          ? "FSBO — featured listing on LECIPM"
          : "FSBO — standard listing on LECIPM"
        : typeof body.description === "string"
          ? body.description
          : undefined,
    connect,
    metadata:
      Object.keys({ ...marketplaceCheckoutMetadata, ...bnhubStripeMetadata }).length > 0
        ? { ...marketplaceCheckoutMetadata, ...bnhubStripeMetadata }
        : undefined,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  if (marketplaceCheckoutMetadata.bnhubReservationPaymentId) {
    await attachCheckoutSessionToReservationPayment(
      marketplaceCheckoutMetadata.bnhubReservationPaymentId,
      result.sessionId
    );
  }

  if (paymentType === "booking" && typeof body.bookingId === "string" && body.bookingId.trim()) {
    const bid = body.bookingId.trim();
    const row = await prisma.booking.findUnique({
      where: { id: bid },
      select: { checkIn: true, checkOut: true, listingId: true, guestId: true },
    });
    if (row) {
      try {
        const pricing = await computeBookingPricing({
          listingId: row.listingId,
          checkIn: row.checkIn.toISOString().slice(0, 10),
          checkOut: row.checkOut.toISOString().slice(0, 10),
          guestUserId: row.guestId,
        });
        const breakdown = pricing
          ? bookingMoneyBreakdownFromPricingBreakdown(bid, pricing.breakdown)
          : null;
        await prisma.payment.update({
          where: { bookingId: bid },
          data: {
            stripeCheckoutSessionId: result.sessionId,
            ...(breakdown ? { moneyBreakdownJson: breakdown as object } : {}),
          },
        });
        if (pricing && pricing.breakdown.lodgingDiscountSource === "LOYALTY" && pricing.breakdown.loyaltyDiscountPercentOffered > 0) {
          logInfo("[bnhub][loyalty] checkout_discount_applied", {
            userId: row.guestId,
            bookingId: bid,
            tier: pricing.breakdown.loyaltyTierCode,
            discountPercent: pricing.breakdown.loyaltyDiscountPercentOffered,
            appliedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        logWarn("[bnhub] checkout_created payment update failed", {
          bookingId: bid,
          message: e instanceof Error ? e.message : String(e),
        });
        await prisma.payment
          .update({
            where: { bookingId: bid },
            data: { stripeCheckoutSessionId: result.sessionId },
          })
          .catch(() => {});
      }
      void persistMoneyEvent({
        type: "booking_checkout_created",
        bookingId: bid,
        metadata: { sessionId: result.sessionId },
      });
    }
  }

  let auditSplit: { platformFeeCents: number; hostPayoutCents: number; bnhubCommissionRate: number } | undefined;
  if (paymentType === "booking" && typeof body.bookingId === "string" && body.bookingId) {
    const s = bnhubBookingFeeSplitCents(chargeAmountCents);
    auditSplit = {
      platformFeeCents: s.platformFeeCents,
      hostPayoutCents: s.hostPayoutCents,
      bnhubCommissionRate: getBnhubCommissionRate(),
    };
  }

  void recordPlatformEvent({
    eventType: "stripe_checkout_session_initiated",
    sourceModule: "stripe",
    entityType: "USER",
    entityId: userId,
    payload: {
      paymentType,
      bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
      amountCents: chargeAmountCents,
      ...auditSplit,
    },
  }).catch(() => {});

  void trackEvent(
    "checkout_started",
    {
      paymentType,
      sessionId: result.sessionId,
      bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
      amountCents: chargeAmountCents,
    },
    { userId }
  ).catch(() => {});
  if (paymentType === "booking" && typeof body.bookingId === "string" && body.bookingId) {
    const bid = body.bookingId.trim();
    const cookieHeader = request.headers.get("cookie");
    const bookingStartMeta = mergeTrafficAttributionIntoMetadata(cookieHeader, {
      bookingId: bid,
      sessionId: result.sessionId,
    });
    void trackEvent("booking_started", bookingStartMeta, { userId }).catch(() => {});
    void import("@/modules/revenue/revenue-events.service").then((m) =>
      m.trackRevenueEvent({
        type: "booking_started",
        userId,
        metadata: {
          source: "bnhub",
          bookingId: bid,
          sessionId: result.sessionId,
        },
      }),
    );
    void prisma.booking
      .findUnique({
        where: { id: bid },
        select: { listingId: true },
      })
      .then((b) => {
        if (!b?.listingId) return;
        return recordInternalCrmEvent({
          eventType: "booking_started",
          channel: "bnhub",
          userId,
          shortTermListingId: b.listingId,
          bookingId: bid,
          metadata: mergeTrafficAttributionIntoMetadata(cookieHeader, {
            source: "stripe_checkout",
            sessionId: result.sessionId,
            listingId: b.listingId,
          }),
        });
      })
      .catch(() => {});
  }
  void onCheckoutStartAutomation(userId, {
    sessionId: result.sessionId,
    paymentType,
    bookingId: typeof body.bookingId === "string" ? body.bookingId : undefined,
  }).catch(() => {});
  void onMessagingTriggerCheckoutStarted(userId).catch(() => {});

  void persistLaunchEvent("CHECKOUT_START", {
    userId,
    sessionId: result.sessionId,
    paymentType,
    amountCents: chargeAmountCents,
    bookingId: typeof body.bookingId === "string" ? body.bookingId.trim() : null,
    listingId:
      paymentType === "booking" && serverBookingListingId
        ? serverBookingListingId
        : typeof body.listingId === "string"
          ? body.listingId
          : null,
  });

  void recordEvolutionOutcome({
    domain: "BNHUB",
    metricType: "CONVERSION",
    strategyKey: "checkout_start",
    entityId: result.sessionId,
    entityType: "CheckoutSession",
    actualJson: {
      userId,
      paymentType,
      amountCents: chargeAmountCents,
      bookingId: typeof body.bookingId === "string" ? body.bookingId.trim() : null,
    },
    reinforceStrategy: true,
    idempotent: false,
  }).catch(() => {});

  void prisma.user
    .findUnique({ where: { id: userId }, select: { createdAt: true } })
    .then((uRow) =>
      import("@/modules/fraud/fraud-engine.service").then((m) =>
        m.evaluateLaunchFraudEngine(
          {
            user: uRow ? { id: userId, createdAt: uRow.createdAt } : { id: userId },
            payment: {
              id: result.sessionId,
              amountCents: chargeAmountCents,
              currency: typeof body.currency === "string" ? body.currency : "cad",
              userId,
            },
            booking:
              paymentType === "booking" && typeof body.bookingId === "string"
                ? { id: body.bookingId.trim() }
                : undefined,
          },
          { persist: true, actionType: "stripe_checkout_start_v1" }
        )
      )
    )
    .catch((e) => logWarn("[launch-fraud] checkout eval skipped", { message: String(e) }));

  logInfo(
    paymentType === "booking"
      ? "[STRIPE] [BOOKING] checkout session ready — redirect guest to Stripe"
      : "[STRIPE] checkout session ready",
    {
      paymentType,
      sessionId: result.sessionId,
      amountCents: chargeAmountCents,
      currency: typeof body.currency === "string" ? String(body.currency).toLowerCase() : "cad",
      bookingId: typeof body.bookingId === "string" ? body.bookingId.trim() : null,
      listingId:
        paymentType === "booking" && serverBookingListingId
          ? serverBookingListingId
          : typeof body.listingId === "string"
            ? body.listingId
            : null,
      platformFeeCents: auditSplit?.platformFeeCents,
      hostPayoutCents: auditSplit?.hostPayoutCents,
    }
  );

  return Response.json({ success: true, url: result.url, sessionId: result.sessionId });
}
