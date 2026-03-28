/**
 * POST /api/stripe/checkout – Create Stripe Checkout session.
 * Body: successUrl, cancelUrl, amountCents, currency?, paymentType, listingId?, projectId?, bookingId?, dealId?, brokerId?, description?
 * Returns: { url } or { error }. Only the Stripe webhook confirms paid/booking state — not success_url.
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertGuestCanCheckoutBooking } from "@/lib/bnhub/booking-checkout-guard";
import { createCheckoutSession, type CreateCheckoutParams, type PaymentType } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import {
  bnhubBookingFeeSplitCents,
  bnhubStripeApplicationFeeCents,
  getBnhubCommissionRate,
} from "@/lib/stripe/bnhub-connect";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordPlatformEvent } from "@/lib/observability";
import { prisma } from "@/lib/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { getFsboPlanPublishPriceCents, parseFsboPublishPlan } from "@/lib/fsbo/constants";
import {
  attachCheckoutSessionToReservationPayment,
  prepareReservationPaymentForCheckout,
} from "@/modules/bnhub-payments/services/paymentService";
import { trackEvent } from "@/src/services/analytics";
import { onCheckoutStartAutomation } from "@/src/services/automation";
import { onMessagingTriggerCheckoutStarted } from "@/src/modules/messaging/triggers";
import { recordInternalCrmEvent } from "@/lib/crm/internal-crm-telemetry";

export const dynamic = "force-dynamic";

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

  const userId = await getGuestId();
  if (userId) {
    const limit = checkRateLimit(`stripe:checkout:${userId}`, { windowMs: 60 * 1000, max: 20 });
    if (!limit.allowed) {
      return Response.json({ error: "Too many checkout requests. Try again in a minute." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }
  }

  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Payments are not configured. Please try again later." },
      { status: 503 }
    );
  }

  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const successUrl = typeof body.successUrl === "string" ? body.successUrl.trim() : "";
  const cancelUrl = typeof body.cancelUrl === "string" ? body.cancelUrl.trim() : "";
  const rawPaymentType = typeof body.paymentType === "string" ? body.paymentType.trim() : "";

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
    return Response.json({ url: result.url, sessionId: result.sessionId });
  }

  const amountCents = typeof body.amountCents === "number" ? body.amountCents : Number(body.amountCents);
  const paymentType = PAYMENT_TYPES.includes(body.paymentType as PaymentType) ? (body.paymentType as PaymentType) : null;

  if (!successUrl || !cancelUrl || !paymentType) {
    return Response.json(
      { error: "successUrl, cancelUrl, and paymentType are required" },
      { status: 400 }
    );
  }
  if (
    paymentType !== "fsbo_publish" &&
    (!Number.isFinite(amountCents) || amountCents < 1)
  ) {
    return Response.json(
      { error: "amountCents (positive) is required for this payment type" },
      { status: 400 }
    );
  }

  let chargeAmountCents = paymentType === "fsbo_publish" ? 0 : Math.round(amountCents);
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

    const bookingHost = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        listingId: true,
        listing: {
          select: {
            owner: {
              select: {
                stripeAccountId: true,
                stripeOnboardingComplete: true,
              },
            },
          },
        },
      },
    });
    serverBookingListingId = bookingHost?.listingId;
    const owner = bookingHost?.listing?.owner;
    if (!owner?.stripeAccountId || !owner.stripeOnboardingComplete) {
      return Response.json(
        { error: "Host payout account is not configured yet." },
        { status: 409 }
      );
    }
    const split = bnhubBookingFeeSplitCents(chargeAmountCents);
    const applicationFeeAmount = bnhubStripeApplicationFeeCents(chargeAmountCents);
    if (applicationFeeAmount >= chargeAmountCents && chargeAmountCents > 0) {
      return Response.json(
        { error: "Invalid BNHub fee split for Stripe Connect." },
        { status: 400 }
      );
    }
    connect = {
      destinationAccountId: owner.stripeAccountId,
      applicationFeeAmount,
      bnhubPlatformFeeCents: split.platformFeeCents,
      bnhubHostPayoutCents: split.hostPayoutCents,
    };
  }

  let marketplaceCheckoutMetadata: Record<string, string> = {};
  if (paymentType === "booking" && typeof body.bookingId === "string" && body.bookingId) {
    const mp = await prepareReservationPaymentForCheckout({
      bookingId: body.bookingId.trim(),
      guestUserId: userId,
    });
    if (!mp.ok) {
      return Response.json({ error: mp.error }, { status: mp.httpStatus ?? 400 });
    }
    marketplaceCheckoutMetadata = { bnhubReservationPaymentId: mp.reservationPaymentId };
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
    metadata: Object.keys(marketplaceCheckoutMetadata).length ? marketplaceCheckoutMetadata : undefined,
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
    void trackEvent("booking_started", { bookingId: bid, sessionId: result.sessionId }, { userId }).catch(() => {});
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
          metadata: { source: "stripe_checkout", sessionId: result.sessionId },
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

  return Response.json({ url: result.url, sessionId: result.sessionId });
}
