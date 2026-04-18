import { NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PaymentStatus, PlatformInvoiceStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/codes/generate-code";
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { getResend, isResendConfigured, getFromEmail } from "@/lib/email/resend";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { addCommissionForReferral, rewardReferralActivation } from "@/lib/referrals";
import {
  grantReferrerVisibilityBoostOnGuestBookingComplete,
  recordGrowthEventWithFunnel,
} from "@/lib/growth/events";
import { recordLecipmManagerGrowthEvent } from "@/lib/growth/manager-events";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";
import { getPublicCodeForReferralRow } from "@/lib/referrals/viral";
import { createCommissionsForPayment, getOrCreateCommissionRules } from "@/lib/stripe/commission";
import { recordPlatformEvent } from "@/lib/observability";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import {
  registrationToSnapshot,
  isRegistrationFormatValid,
  type BrokerTaxSnapshotJson,
} from "@/lib/tax/broker-tax-snapshot";
import { createRevenueLedgerForPayment } from "@/lib/finance/revenue-ledger";
import { getPlatformFinancialSettings } from "@/lib/finance/platform-financial-settings";
import { getPlatformTaxRegistrationFromEnvironment } from "@/lib/finance/platform-tax-registration";
import { buildInvoiceForPlatformPayment, buildSplitIssuerInvoiceRecords } from "@/lib/finance/payment-invoice";
import { assertBookingStripeWebhookValid } from "@/lib/bnhub/booking-checkout-guard";
import { bnhubBookingFeeSplitCents } from "@/lib/stripe/bnhub-connect";
import { allocateUniqueConfirmationCode } from "@/lib/bnhub/confirmation-code";
import { applyGuarantee } from "@/lib/bnhub/bnhub-guarantee";
import { ensureBnhubBookingChecklist } from "@/lib/bnhub/booking-checklist";
import { sendBnhubPostPaymentEmails } from "@/lib/email/bnhub-lifecycle-emails";
import { onBnhubBookingPaymentConfirmed } from "@/lib/crm/internal-crm-telemetry";
import {
  handleMortgageExpertCheckoutCompleted,
  handleMortgageExpertSubscriptionStripeEvent,
} from "@/lib/stripe/mortgage-expert-webhook";
import { applyMortgageContactUnlock } from "@/modules/mortgage/services/apply-mortgage-contact-unlock";
import { syncSubscriptionFromWebhook } from "@/modules/billing/syncSubscriptionFromWebhook";
import {
  handleBrokerLecipmSubscriptionCheckoutCompleted,
  handleBrokerLecipmSubscriptionStripeEvent,
} from "@/modules/billing/brokerLecipmSubscription";
import { completeLeadMarketplacePurchase } from "@/modules/lead-marketplace/application/completeLeadMarketplacePurchase";
import {
  applyBrokerAssignedLeadCheckoutSuccess,
  applyBrokerLeadInvoiceCheckoutSuccess,
  markBrokerLeadCheckoutFailed,
} from "@/modules/billing/brokerLeadBilling";
import { syncReservationPaymentPaidFromWebhook } from "@/modules/bnhub-payments/services/paymentService";
import { markPaymentFailed } from "@/modules/bnhub-payments/services/paymentService";
import { stripeHandleCheckoutSessionCompleted } from "@/lib/payments/providers/stripe";
import { computePayoutScheduledAt, schedulePayoutFromBooking } from "@/lib/payments/payout";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import { applyLoyaltyCreditForPaidBooking } from "@/lib/loyalty/loyalty-service";
import type { SelectedAddonInput } from "@/lib/bnhub/hospitality-addons";
import { bookingMoneyBreakdownFromPricingBreakdown } from "@/lib/bookings/money";
import { persistMoneyEvent } from "@/lib/payments/money-events";
import { queueBnhubManualHostPayout } from "@/lib/payouts/manual-bnhub";
import { markStripeWebhookProcessed } from "@/modules/bnhub-payments/infrastructure/stripeWebhookInbox";
import { gateStripeWebhookProcessing } from "@/modules/stripe/stripe-webhook.service";
import { BnhubMpWebhookInboxStatus } from "@prisma/client";
import { captureStripeEventForGrowthEngine } from "@/src/modules/stripe/growthWebhook";
import { onPaymentFailedAutomation, onPaymentSuccessAutomation } from "@/src/services/automation";
import { logBusinessMilestone, trackErrorEvent, trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import { syncHostOnboardingCompleteFromStripe } from "@/lib/stripe/hostConnectExpress";
import {
  GUEST_SUPABASE_BOOKING_PAYMENT_TYPE,
  markGuestSupabaseBookingPaidFromStripeSession,
} from "@/lib/stripe/guestSupabaseBooking";
import { fulfillListingContactLeadFromWebhook } from "@/lib/leads/fulfill-from-webhook";
import { fulfillFeaturedListingFromWebhook } from "@/lib/featured/fulfill-featured-checkout-webhook";
import { fulfillFsboFeaturedFromStripeSession } from "@/lib/featured/fulfill-fsbo-featured-webhook";
import { reconcileFeaturedListingAfterDuplicatePayment } from "@/lib/featured/reconcile-featured-checkout";
import { trackRevenueEvent } from "@/lib/monetization/events";
import { recordRevenueEventLedger } from "@/modules/revenue/revenue-event.service";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { securityLog } from "@/lib/security/security-logger";
import { auditStripePaymentEventIfApplicable } from "@/modules/stripe/validation.service";
import { onLeadUnlockPaymentRecorded } from "@/modules/leads/lead-monetization-monitoring.service";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;
const STORAGE_UPGRADE_FEATURE = "storage-upgrade";

async function sendPaymentSuccessEmail(userId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) return;
    await resend.emails.send({
      from: getFromEmail(),
      to: user.email,
      subject: "Payment موفق",
      html: "<p>Your subscription is active</p>",
    });
  } catch (err) {
    logError("Payment success email failed", err);
  }
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

async function syncConnectedAccountStatusFromEvent(stripe: Stripe, accountId: string) {
  const user = await prisma.user.findFirst({
    where: { stripeAccountId: accountId },
    select: { id: true },
  });
  if (!user) return null;
  return syncHostOnboardingCompleteFromStripe(stripe, user.id, accountId);
}

/**
 * POST /api/stripe/webhook
 *
 * - Stripe sends raw body; we read it as text for signature verification.
 * - Do NOT unlock any feature without this webhook: all entitlements (design access,
 *   storage upgrade, plan) are applied only after constructEvent() succeeds.
 * - Always rely on DB (UpgradeInvoice, DesignAccess, UserStorage, BillingAuditLog)
 *   for subscription/paid state; never trust client or success_url alone.
 */
const isProdRuntime = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    logError("STRIPE_WEBHOOK_SECRET is not set");
    return Response.json(
      { error: isProdRuntime ? "Webhook misconfigured" : "Webhook not configured. Add STRIPE_WEBHOOK_SECRET to .env" },
      { status: 500 }
    );
  }

  if (!webhookSecret.startsWith("whsec_")) {
    logError("STRIPE_WEBHOOK_SECRET must start with whsec_ (Stripe CLI or Dashboard signing secret)");
    return Response.json(
      { error: isProdRuntime ? "Webhook misconfigured" : "Invalid webhook secret format. Expected whsec_… from Stripe." },
      { status: 500 }
    );
  }
  const stripeKeyErr = describeStripeSecretKeyError();
  if (stripeKeyErr) {
    logError(`[STRIPE] ${stripeKeyErr}`);
    return Response.json({ error: stripeKeyErr }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Stripe is not configured (demo mode or client unavailable)." },
      { status: 503 }
    );
  }

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return Response.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return Response.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    void securityLog({
      event: "webhook_signature_invalid",
      detail: "stripe_construct_event",
      persist: true,
      entityId: "stripe_webhook",
      payload: { verified: false },
    });
    logError(
      "[STRIPE] webhook signature verification failed",
      `${message} — Local dev: STRIPE_WEBHOOK_SECRET must exactly match the whsec_* printed when you started stripe listen (same Stripe account as STRIPE_SECRET_KEY); restart pnpm dev after editing .env.`,
    );
    return Response.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  logInfo("[webhook] event received", { type: event.type, id: event.id });
  logInfo(`[STRIPE] webhook received: type=${event.type} id=${event.id}`);

  void auditStripePaymentEventIfApplicable(event).catch((e) =>
    logError("stripe payment audit log failed", e),
  );

  void captureStripeEventForGrowthEngine(event).catch((e) => logError("growth stripe observability failed", e));

  try {
    const gate = await gateStripeWebhookProcessing(event);
    if (gate === "skip_duplicate") {
      logInfo("[webhook] duplicate processed event skipped (idempotent)", { id: event.id });
      return Response.json({ received: true, duplicate: true });
    }
  } catch (e) {
    logError("bnhub webhook idempotency gate failed", e);
    return Response.json({ error: "Webhook inbox error" }, { status: 500 });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    const refundCents = charge.amount_refunded ?? 0;
    if (paymentIntentId) {
      const chargeFull = typeof charge.amount === "number" ? charge.amount : 0;
      const refunded = typeof charge.amount_refunded === "number" ? charge.amount_refunded : 0;
      const nextStatus =
        chargeFull > 0 && refunded > 0 && refunded < chargeFull
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED;
      await prisma.payment
        .updateMany({
          where: { stripePaymentId: paymentIntentId },
          data: { status: nextStatus },
        })
        .catch((e) => logError("Webhook: refund payment update failed", e));
      const pp = await prisma.platformPayment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true, userId: true },
      }).catch(() => null);
      if (pp) {
        await prisma.platformPayment
          .update({
            where: { id: pp.id },
            data: { refundedAmountCents: { increment: refundCents } },
          })
          .catch((e) => logError("Webhook: platform payment refund increment failed", e));
      }
      await prisma.stripeLedgerEntry
        .create({
          data: {
            stripeEventId: event.id,
            objectType: "refund",
            stripeObjectId: charge.id,
            amountCents: -Math.abs(refundCents),
            feeCents: 0,
            currency: (charge.currency ?? "cad").toLowerCase(),
            status: "refunded",
            userId: pp?.userId ?? null,
            platformPaymentId: pp?.id ?? null,
            metadata: { paymentIntentId } as object,
          },
        })
        .catch((e) => logError("Webhook: stripe ledger refund duplicate or failed", e));
      let piMeta: Record<string, string> = {};
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        piMeta = { ...(pi.metadata as Record<string, string>) };
      } catch {
        /* optional */
      }
      void persistLaunchEvent("PAYMENT_REFUNDED", {
        paymentIntentId,
        amountRefundedCents: refundCents,
        userId: piMeta.userId ?? null,
        paymentType: piMeta.paymentType ?? null,
        bookingId: piMeta.bookingId ?? null,
        listingId: piMeta.listingId ?? null,
      });

      const payRow = await prisma.payment
        .findFirst({
          where: { stripePaymentId: paymentIntentId },
          select: { bookingId: true, hostPayoutCents: true },
        })
        .catch(() => null);
      if (payRow?.bookingId) {
        const sentPayout = await prisma.orchestratedPayout
          .findFirst({
            where: { bookingId: payRow.bookingId, status: "sent", providerRef: { not: null } },
            select: { hostId: true, providerRef: true },
          })
          .catch(() => null);
        if (sentPayout) {
          const b = await prisma.booking
            .findUnique({
              where: { id: payRow.bookingId },
              select: { listing: { select: { ownerId: true } } },
            })
            .catch(() => null);
          const ownerId = b?.listing?.ownerId ?? sentPayout.hostId;
          await prisma.payment
            .updateMany({
              where: { bookingId: payRow.bookingId },
              data: { payoutHoldReason: "refund_after_transfer" },
            })
            .catch((e) => logError("Webhook: refund hold on payment failed", e));
          await queueBnhubManualHostPayout({
            bookingId: payRow.bookingId,
            hostUserId: ownerId,
            amountCents: refundCents > 0 ? refundCents : payRow.hostPayoutCents ?? 0,
            queueReason: "refund_after_payout_sent",
          }).catch((e) => logError("Webhook: manual reconciliation queue failed", e));
          void persistMoneyEvent({
            type: "booking_refunded",
            bookingId: payRow.bookingId,
            hostUserId: ownerId,
            amountCents: refundCents,
            metadata: {
              phase: "after_host_transfer",
              stripeTransferId: sentPayout.providerRef,
            },
          });
        }
      }
    }
    return Response.json({ received: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const md = pi.metadata ?? {};
    if (md.paymentType === "broker_assigned_lead" && typeof md.brokerLeadId === "string") {
      await markBrokerLeadCheckoutFailed(prisma, {
        stripePaymentIntentId: pi.id,
        brokerLeadId: md.brokerLeadId,
      }).catch((e) => logError("Webhook: broker assigned lead payment failed handling", e));
    }
    void recordPlatformEvent({
      eventType: "payment_failed",
      entityType: "PAYMENT_INTENT",
      entityId: pi.id,
      payload: { error: pi.last_payment_error?.message },
    });
    const failUserId = typeof md.userId === "string" ? md.userId : null;
    void trackEvent(
      "payment_failed",
      { paymentIntentId: pi.id, paymentType: typeof md.paymentType === "string" ? md.paymentType : undefined },
      { userId: failUserId }
    );
    void trackErrorEvent({
      errorType: "stripe_payment_intent_failed",
      message: pi.last_payment_error?.message ?? "payment_intent.payment_failed",
      userId: failUserId,
      route: "/api/stripe/webhook",
      metadata: { paymentIntentId: pi.id },
    });
    logBusinessMilestone("PAYMENT FAILED", { paymentIntentId: pi.id });
    void onPaymentFailedAutomation(undefined, {
      paymentIntentId: pi.id,
      error: pi.last_payment_error?.message,
    }).catch(() => {});
    void persistLaunchEvent("CHECKOUT_FAILED", {
      paymentIntentId: pi.id,
      userId: typeof md.userId === "string" ? md.userId : null,
      paymentType: typeof md.paymentType === "string" ? md.paymentType : null,
      bookingId: typeof md.bookingId === "string" ? md.bookingId : null,
      listingId: typeof md.listingId === "string" ? md.listingId : null,
      error: pi.last_payment_error?.message ?? null,
    });
    void persistLaunchEvent("PAYMENT_FAILED", {
      paymentIntentId: pi.id,
      userId: typeof md.userId === "string" ? md.userId : null,
      paymentType: typeof md.paymentType === "string" ? md.paymentType : null,
    });
    if (md.paymentType === "booking" && typeof md.bookingId === "string" && md.bookingId.trim()) {
      const bid = md.bookingId.trim();
      await prisma.payment
        .updateMany({
          where: { bookingId: bid, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        })
        .catch((e) => logError("Webhook: booking payment_intent.payment_failed update failed", e));
      logInfo("[stripe/webhook] [booking] payment_intent.payment_failed", {
        bookingId: bid,
        paymentIntentId: pi.id,
      });
    }
    void import("@/lib/fraud/compute-payment-risk")
      .then((m) => m.evaluatePaymentFraudFromStripePaymentIntent(pi))
      .catch(() => {});
    return Response.json({ received: true });
  }

  if (event.type === "invoice.payment_failed") {
    const workspaceFailed = await syncSubscriptionFromWebhook({ event, prisma, stripe });
    if (workspaceFailed) return Response.json({ received: true, workspaceInvoiceFailed: true });
  }

  if (event.type === "invoice.paid") {
    const workspacePaid = await syncSubscriptionFromWebhook({ event, prisma, stripe });
    if (workspacePaid) return Response.json({ received: true, workspaceInvoicePaid: true });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.created"
  ) {
    const subHandled = await handleMortgageExpertSubscriptionStripeEvent(stripe, event);
    if (subHandled) return Response.json({ received: true, mortgageExpertSubscription: true });
    const brokerLecipmSubHandled = await handleBrokerLecipmSubscriptionStripeEvent(stripe, event, prisma);
    if (brokerLecipmSubHandled) {
      return Response.json({ received: true, brokerLecipmSubscription: true });
    }
    const workspaceHandled = await syncSubscriptionFromWebhook({ event, prisma, stripe });
    if (workspaceHandled) return Response.json({ received: true, workspaceSubscription: true });
  }

  if (event.type === "checkout.session.expired") {
    const expiredSession = event.data.object as Stripe.Checkout.Session;
    const em = expiredSession.metadata ?? {};
    logInfo("[STRIPE] checkout.session.expired — no charge", {
      sessionId: expiredSession.id,
      paymentType: typeof em.paymentType === "string" ? em.paymentType : null,
      type: typeof em.type === "string" ? em.type : null,
      bookingId: typeof em.bookingId === "string" ? em.bookingId : null,
    });
    void persistLaunchEvent("CHECKOUT_EXPIRED", {
      sessionId: expiredSession.id,
      userId: typeof em.userId === "string" ? em.userId : null,
      paymentType: typeof em.paymentType === "string" ? em.paymentType : null,
      bookingId: typeof em.bookingId === "string" ? em.bookingId : null,
      listingId: typeof em.listingId === "string" ? em.listingId : null,
    });
    return Response.json({ received: true });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservationPaymentId =
      typeof session.metadata?.bnhubReservationPaymentId === "string"
        ? session.metadata.bnhubReservationPaymentId
        : null;
    if (reservationPaymentId) {
      await markPaymentFailed(reservationPaymentId, "checkout.session.async_payment_failed").catch((e) =>
        logError("Webhook: marketplace async payment failed update failed", e)
      );
    }
    if (typeof session.metadata?.bookingId === "string") {
      await prisma.bnhubBookingEvent
        .create({
          data: {
            bookingId: session.metadata.bookingId,
            eventType: "payment_failed",
            actorId: typeof session.metadata?.userId === "string" ? session.metadata.userId : null,
            payload: { source: event.type, sessionId: session.id },
          },
        })
        .catch(() => {});
    }
    void markStripeWebhookProcessed(event.id, BnhubMpWebhookInboxStatus.FAILED).catch((e) =>
      logError("Webhook: inbox mark failed failed", e)
    );
    logWarn("[STRIPE] [PAYMENT] async_payment_failed — booking not confirmed", {
      sessionId: session.id,
      bookingId: typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : null,
      paymentType: typeof session.metadata?.paymentType === "string" ? session.metadata.paymentType : null,
    });
    return Response.json({ received: true, asyncPaymentFailed: true });
  }

  if (event.type === "account.updated" || event.type === "account.external_account.updated") {
    const connectedAccountId =
      event.type === "account.updated"
        ? (event.data.object as Stripe.Account).id
        : event.account ?? null;
    if (connectedAccountId) {
      await syncConnectedAccountStatusFromEvent(stripe, connectedAccountId).catch((e) =>
        logError("Webhook: connect account sync failed", e)
      );
      void recordPlatformEvent({
        eventType: "stripe_connect_account_updated",
        sourceModule: "stripe",
        entityType: "PAYMENT_ACCOUNT",
        entityId: connectedAccountId,
        payload: { stripeEventType: event.type },
      }).catch(() => {});
    }
    return Response.json({ received: true, connectAccountUpdated: true });
  }

  if (event.type === "payout.failed" || event.type === "payout.paid") {
    const payout = event.data.object as Stripe.Payout;
    const connectedAccountId = event.account ?? null;
    if (connectedAccountId) {
      await syncConnectedAccountStatusFromEvent(stripe, connectedAccountId).catch((e) =>
        logError(`Webhook: ${event.type} connect sync failed`, e)
      );
    }
    const bookingId =
      typeof payout.metadata?.bookingId === "string" && payout.metadata.bookingId.trim()
        ? payout.metadata.bookingId.trim()
        : null;
    if (event.type === "payout.failed" && bookingId) {
      await prisma.payment
        .updateMany({
          where: { bookingId },
          data: { payoutHoldReason: "payout_failed", hostPayoutReleasedAt: null },
        })
        .catch((e) => logError("Webhook: payout.failed payment hold update failed", e));
      await prisma.bnhubBookingEvent
        .create({
          data: {
            bookingId,
            eventType: "payout_failed",
            actorId: null,
            payload: {
              source: "stripe_payout_failed",
              payoutId: payout.id,
              failureCode: payout.failure_code ?? null,
            },
          },
        })
        .catch(() => {});
    }
    if (event.type === "payout.paid" && bookingId) {
      await prisma.payment
        .updateMany({
          where: { bookingId, status: PaymentStatus.COMPLETED },
          data: { payoutHoldReason: null, hostPayoutReleasedAt: new Date() },
        })
        .catch((e) => logError("Webhook: payout.paid payment release update failed", e));
      await prisma.bnhubBookingEvent
        .create({
          data: {
            bookingId,
            eventType: "payout_paid",
            actorId: null,
            payload: { source: "stripe_payout_paid", payoutId: payout.id },
          },
        })
        .catch(() => {});
    }
    void recordPlatformEvent({
      eventType: event.type === "payout.failed" ? "stripe_payout_failed" : "stripe_payout_paid",
      sourceModule: "stripe",
      entityType: "PAYOUT",
      entityId: payout.id,
      payload: {
        connectedAccountId,
        bookingId,
        payoutStatus: payout.status ?? null,
        failureCode: payout.failure_code ?? null,
        failureMessage: payout.failure_message ?? null,
      },
    }).catch(() => {});
    return Response.json({ received: true, payoutEvent: event.type });
  }

  if (event.type === "payment_intent.succeeded") {
    /**
     * BNHUB booking confirmation + PAYMENT_SUCCESS are applied from `checkout.session.completed`
     * (session metadata, platformPayment row, idempotency). This handler acknowledges the PI so
     * Stripe retries stop; DB remains single-writer via session + `payment.updateMany` where status=PENDING.
     */
    const pi = event.data.object as Stripe.PaymentIntent;
    logInfo("[STRIPE] payment_intent.succeeded acknowledged (fulfillment via checkout.session.completed)", {
      paymentIntentId: pi.id,
      amountReceived: pi.amount_received ?? pi.amount,
      currency: pi.currency,
    });
    return Response.json({ received: true });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  logInfo(
    `[STRIPE] webhook_received: type=${event.type} sessionId=${session.id} paymentStatus=${session.payment_status} amountTotal=${session.amount_total ?? 0} paymentType=${session.metadata?.paymentType ?? "n/a"} stripeEventId=${event.id}`
  );

  /** Mobile guest Supabase `bookings` — no Prisma User; fulfillment updates Supabase only. */
  if (session.metadata?.paymentType === GUEST_SUPABASE_BOOKING_PAYMENT_TYPE) {
    try {
      await stripeHandleCheckoutSessionCompleted(session, { stripeEventId: event.id });
    } catch (e) {
      logError("Stripe webhook: orchestrated payment bridge failed (guest_supabase_booking)", e);
    }
    if (session.payment_status !== "paid") {
      logInfo(`[STRIPE] ${event.type}: guest_supabase_booking awaiting paid for session ${session.id}`);
      return Response.json({ received: true, awaitingPaidState: true, guestSupabaseBooking: true });
    }
    const guestPaid = await markGuestSupabaseBookingPaidFromStripeSession(session);
    const piFromSession =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? (session.payment_intent as Stripe.PaymentIntent).id
          : null;
    if (!guestPaid.ok) {
      if (guestPaid.reason === "booking_not_found") {
        logWarn("Webhook: guest_supabase_booking — booking row missing (metadata ok)", {
          sessionId: session.id,
          paymentIntentId: piFromSession,
          reason: guestPaid.reason,
        });
      } else {
        logError("Webhook: guest_supabase_booking mark paid failed", new Error(guestPaid.reason ?? "unknown"));
      }
    } else {
      logInfo("Webhook: guest_supabase_booking fulfilled", {
        sessionId: session.id,
        paymentIntentId: piFromSession,
        bookingId: typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : null,
      });
    }
    return Response.json({ received: true, guestSupabaseBooking: true, paidMarked: guestPaid.ok });
  }

  try {
    await stripeHandleCheckoutSessionCompleted(session, { stripeEventId: event.id });
  } catch (e) {
    logError("Stripe webhook: orchestrated payment bridge failed", e);
  }

  if (session.payment_status !== "paid") {
    logInfo(`[STRIPE] ${event.type}: awaiting final paid state for session ${session.id}`);
    return Response.json({ received: true, awaitingPaidState: true });
  }

  if (session.payment_status === "paid") {
    const md = session.metadata ?? {};
    const bookingIdMeta = typeof md.bookingId === "string" ? md.bookingId.trim() : "";
    const userIdMeta = typeof md.userId === "string" ? md.userId.trim() : "";
    if (bookingIdMeta && userIdMeta) {
      logInfo("[webhook] [booking] checkout session paid (launch marker)", {
        bookingId: md.bookingId,
        amountCents: session.amount_total,
        sessionId: session.id,
      });
      await prisma.launchEvent.create({
        data: {
          event: "PAYMENT_SUCCESS",
          payload: { metadata: md } as Prisma.InputJsonValue,
          userId: userIdMeta || undefined,
        },
      });
    }
  }

  const metadataType = session.metadata?.type as string;
  const paymentType = session.metadata?.paymentType as string | undefined;
  const userId = session.metadata?.userId;
  const projectId = session.metadata?.projectId as string | undefined;
  const leadId = session.metadata?.leadId as string | undefined;
  const amountTotal = session.amount_total ?? 0;
  const amountDollars = amountTotal / 100;
  const amountCents = amountTotal;
  const referralRow = userId
    ? await prisma.referral
        .findFirst({
          where: { usedByUserId: userId },
          select: { code: true, referralPublicCode: true, referrerId: true },
        })
        .catch(() => null)
    : null;
  const referralAttributionCode = referralRow ? await getPublicCodeForReferralRow(referralRow) : null;

  /**
   * PAYMENT_SUCCESS / CHECKOUT_SUCCESS for BNHUB bookings are emitted only after DB confirms
   * booking + payment (see platform payment branch). Non-booking paid checkouts record here.
   */
  if (
    session.payment_status === "paid" &&
    typeof userId === "string" &&
    userId.length > 0 &&
    paymentType !== "booking"
  ) {
    void persistLaunchEvent("PAYMENT_SUCCESS", {
      userId,
      sessionId: session.id,
      amountCents,
      paymentType: paymentType ?? null,
      listingId: typeof session.metadata?.listingId === "string" ? session.metadata.listingId : null,
      bookingId: typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : null,
    });
    void persistLaunchEvent("CHECKOUT_SUCCESS", {
      userId,
      sessionId: session.id,
      amountCents,
      paymentType: paymentType ?? null,
      listingId: typeof session.metadata?.listingId === "string" ? session.metadata.listingId : null,
      bookingId: typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : null,
    });
    logInfo(
      `[STRIPE] payment success: bookingId=${typeof session.metadata?.bookingId === "string" ? session.metadata.bookingId : "n/a"} paymentType=${paymentType ?? "n/a"}`
    );
  }

  const mortgageCheckoutHandled = await handleMortgageExpertCheckoutCompleted({
    stripe,
    session,
    stripeEventId: event.id,
  });
  if (mortgageCheckoutHandled) {
    return Response.json({ received: true, mortgageExpertCheckout: true });
  }

  const brokerLecipmCheckoutHandled = await handleBrokerLecipmSubscriptionCheckoutCompleted({
    stripe,
    session,
    prisma,
  });
  if (brokerLecipmCheckoutHandled) {
    await prisma.trafficEvent
      .create({
        data: {
          eventType: "subscription_purchased",
          path: "/dashboard/broker",
          source: "stripe_webhook",
          medium: "billing",
          meta: {
            userId: session.metadata?.userId ?? null,
            plan: session.metadata?.lecipmBrokerPlan ?? null,
          } as object,
        },
      })
      .catch(() => {});
    return Response.json({ received: true, brokerLecipmSubscriptionCheckout: true });
  }

  const workspaceCheckoutHandled = await syncSubscriptionFromWebhook({ event, prisma, stripe });
  if (workspaceCheckoutHandled) {
    return Response.json({ received: true, workspaceSubscriptionCheckout: true });
  }

  // ----- Platform payment flow (booking, subscription, lead_unlock, deposit, closing_fee) -----
  const PLATFORM_PAYMENT_TYPES = [
    "booking",
    "subscription",
    "lead_unlock",
    "mortgage_contact_unlock",
    "deposit",
    "closing_fee",
    "featured_listing",
    "fsbo_publish",
    "lead_marketplace",
    "broker_assigned_lead",
    "broker_lead_invoice",
    "listing_contact_lead",
  ];
  if (paymentType && PLATFORM_PAYMENT_TYPES.includes(paymentType) && userId) {
    const sessionId = session.id;
    const existingPayment = await prisma.platformPayment.findUnique({
      where: { stripeSessionId: sessionId },
    });
    if (existingPayment) {
      if (paymentType === "featured_listing" && userId) {
        try {
          await reconcileFeaturedListingAfterDuplicatePayment(prisma, {
            session,
            userId: userId as string,
            existingPayment: {
              id: existingPayment.id,
              amountCents: existingPayment.amountCents,
            },
          });
        } catch (e) {
          logError("Webhook: featured listing reconcile on duplicate session failed", e);
        }
      }
      return Response.json({ received: true, duplicate: true });
    }

    const listingId = session.metadata?.listingId as string | undefined;
    const bookingId = session.metadata?.bookingId as string | undefined;
    const dealId = session.metadata?.dealId as string | undefined;
    const brokerId = session.metadata?.brokerId as string | undefined;

    if (paymentType === "booking" && bookingId) {
      const mdUserId = typeof userId === "string" ? userId.trim() : "";
      const mdBookingId = typeof bookingId === "string" ? bookingId.trim() : "";
      const mdListingId =
        typeof session.metadata?.listingId === "string" ? session.metadata.listingId.trim() : "";
      if (!mdUserId || !mdBookingId || !mdListingId) {
        logError("Webhook: booking checkout.session.completed missing required metadata — no fulfillment", {
          hasUserId: Boolean(mdUserId),
          hasBookingId: Boolean(mdBookingId),
          hasListingId: Boolean(mdListingId),
        });
        return Response.json({ received: true, ignored: "missing_booking_metadata" });
      }

      const bookingCheck = await assertBookingStripeWebhookValid({
        bookingId: mdBookingId,
        metadataUserId: mdUserId,
        amountTotalCents: amountCents,
      });
      if (!bookingCheck.ok) {
        logError("Webhook: booking payment rejected — no DB updates", {
          reason: bookingCheck.reason,
          bookingId: mdBookingId,
          userId: mdUserId,
          amountCents,
        });
        return Response.json({ received: true, ignored: bookingCheck.reason });
      }
    }

    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? (session.payment_intent as Stripe.PaymentIntent).id
          : null;

    const sessionAmountTotal = session.amount_total ?? amountCents;
    const sessionCurrency = (session.currency ?? "cad").toLowerCase();

    let stripeFeeCents = 0;
    let stripeReceiptUrl: string | null = null;
    /** Connect application fee on PaymentIntent (minor units). */
    let stripeApplicationFeeCents: number | null = null;
    if (piId && stripe) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ["latest_charge.balance_transaction"],
        });
        if (typeof pi.application_fee_amount === "number") {
          stripeApplicationFeeCents = pi.application_fee_amount;
        }
        const latest = pi.latest_charge;
        let ch: Stripe.Charge | null = null;
        if (typeof latest === "string") {
          ch = await stripe.charges.retrieve(latest);
        } else if (latest && typeof latest === "object") {
          ch = latest as Stripe.Charge;
        }
        stripeReceiptUrl = ch?.receipt_url ?? null;
        const bt = ch?.balance_transaction;
        if (bt && typeof bt === "object" && "fee" in bt && typeof (bt as Stripe.BalanceTransaction).fee === "number") {
          stripeFeeCents = (bt as Stripe.BalanceTransaction).fee;
        }
      } catch (e) {
        logError("Webhook: Stripe PaymentIntent/charge retrieve failed", e);
      }
    }

    let brokerTaxSnapshot: BrokerTaxSnapshotJson | null = null;
    if (brokerId) {
      const reg = await prisma.brokerTaxRegistration.findUnique({ where: { userId: brokerId } }).catch(() => null);
      if (reg) {
        brokerTaxSnapshot = registrationToSnapshot(reg, isRegistrationFormatValid(reg));
      }
    }

    const platformPayment = await prisma.platformPayment.create({
      data: {
        userId,
        listingId: listingId ?? null,
        projectId: projectId ?? null,
        bookingId: bookingId ?? null,
        dealId: dealId ?? null,
        paymentType,
        amountCents: sessionAmountTotal,
        currency: sessionCurrency,
        status: "paid",
        stripeSessionId: sessionId,
        stripePaymentIntentId: piId,
        stripeFeeCents: stripeFeeCents || null,
        metadata: session.metadata ? (session.metadata as object) : undefined,
        brokerTaxSnapshot: brokerTaxSnapshot ?? undefined,
      },
    });

    logInfo("[STRIPE] [PAYMENT] platform_payment recorded (awaiting type-specific fulfillment)", {
      platformPaymentId: platformPayment.id,
      userId,
      bookingId: bookingId ?? null,
      listingId: listingId ?? null,
      paymentType,
      type: typeof session.metadata?.type === "string" ? session.metadata.type : null,
      amountCents: sessionAmountTotal,
      currency: sessionCurrency,
      stripeSessionId: sessionId,
      stripePaymentIntentId: piId,
    });

    await prisma.stripeLedgerEntry
      .create({
        data: {
          stripeEventId: event.id,
          objectType: "checkout_session",
          stripeObjectId: session.id,
          amountCents,
          feeCents: stripeFeeCents,
          currency: (session.currency ?? "cad").toLowerCase(),
          status: "succeeded",
          userId,
          platformPaymentId: platformPayment.id,
          metadata: { paymentType, bookingId, dealId, listingId } as object,
        },
      })
      .catch((e) => logError("Webhook: stripe ledger insert failed", e));

    if (paymentType === "booking" && bookingId) {
      const connectDestination =
        typeof session.metadata?.connectDestination === "string"
          ? session.metadata.connectDestination.trim()
          : null;

      if (connectDestination && stripe) {
        try {
          const hostAcct = await stripe.accounts.retrieve(connectDestination);
          logInfo("[webhook] [payout] host connect readiness snapshot", {
            bookingId,
            details_submitted: hostAcct.details_submitted,
            charges_enabled: hostAcct.charges_enabled,
            payouts_enabled: hostAcct.payouts_enabled,
          });
        } catch (e) {
          logWarn("[STRIPE] webhook: connected account retrieve failed (readiness log)", e);
        }
      }

      const metaFee = session.metadata?.applicationFeeCents;
      const parsedMetaFee = typeof metaFee === "string" ? parseInt(metaFee, 10) : NaN;
      const metaBnhubPlatform =
        typeof session.metadata?.bnhubPlatformFeeCents === "string"
          ? parseInt(session.metadata.bnhubPlatformFeeCents, 10)
          : NaN;
      const metaBnhubHost =
        typeof session.metadata?.bnhubHostPayoutCents === "string"
          ? parseInt(session.metadata.bnhubHostPayoutCents, 10)
          : NaN;
      const splitConfigured = bnhubBookingFeeSplitCents(sessionAmountTotal);
      const metaSplitValid =
        Number.isFinite(metaBnhubPlatform) &&
        Number.isFinite(metaBnhubHost) &&
        metaBnhubPlatform >= 0 &&
        metaBnhubHost >= 0 &&
        metaBnhubPlatform + metaBnhubHost === sessionAmountTotal;

      let platformFeeResolved =
        typeof stripeApplicationFeeCents === "number"
          ? stripeApplicationFeeCents
          : Number.isFinite(parsedMetaFee)
            ? parsedMetaFee
            : metaSplitValid
              ? metaBnhubPlatform
              : splitConfigured.platformFeeCents;

      platformFeeResolved = Math.min(Math.max(0, platformFeeResolved), sessionAmountTotal);
      const hostPayoutResolved = sessionAmountTotal - platformFeeResolved;

      const { resolveGuestEnforceableContractForBooking } = await import(
        "@/lib/legal/resolve-booking-enforceable-contract"
      );
      const { enforceableContractsRequired } = await import("@/lib/legal/enforceable-contracts-enforcement");
      const enforceableLink = await resolveGuestEnforceableContractForBooking(bookingId);

      const bookingRow = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          guestId: true,
          listingId: true,
          checkIn: true,
          checkOut: true,
          confirmationCode: true,
          guestsCount: true,
          bnhubBookingServices: { select: { listingServiceId: true, quantity: true } },
          guest: { select: { name: true } },
          listing: { select: { title: true, ownerId: true } },
        },
      });

      const scheduledHostPayoutAt = bookingRow ? computePayoutScheduledAt(bookingRow.checkIn) : null;

      let moneyBreakdownJson: Prisma.InputJsonValue | undefined;
      if (bookingRow) {
        const breakdownListingId =
          (typeof listingId === "string" ? listingId.trim() : "") || bookingRow.listingId;
        const selectedAddons: SelectedAddonInput[] = bookingRow.bnhubBookingServices.map((s) => ({
          listingServiceId: s.listingServiceId,
          quantity: s.quantity,
        }));
        try {
          const pricing = await computeBookingPricing({
            listingId: breakdownListingId,
            checkIn: bookingRow.checkIn.toISOString().slice(0, 10),
            checkOut: bookingRow.checkOut.toISOString().slice(0, 10),
            guestCount: bookingRow.guestsCount ?? undefined,
            selectedAddons: selectedAddons.length ? selectedAddons : undefined,
            guestUserId: bookingRow.guestId,
          });
          if (pricing) {
            const br = bookingMoneyBreakdownFromPricingBreakdown(bookingId, pricing.breakdown);
            moneyBreakdownJson = br as unknown as Prisma.InputJsonValue;
          }
        } catch (e) {
          logWarn("Webhook: money breakdown compute skipped", e);
        }
      }

      let confirmationCode = bookingRow?.confirmationCode ?? null;
      if (!confirmationCode) {
        try {
          confirmationCode = await allocateUniqueConfirmationCode();
        } catch (e) {
          logError("Webhook: confirmation code allocation failed", e);
        }
      }

      await prisma.booking
        .update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            ...(confirmationCode ? { confirmationCode } : {}),
          },
        })
        .catch((e) => logError("Webhook: booking confirm failed", e));

      logInfo(`[STRIPE] booking updated: bookingId=${bookingId} status=CONFIRMED paymentStatus=COMPLETED`);

      if (bookingRow?.listingId) {
        void import("@/lib/listings/listing-analytics-service").then((m) =>
          m.incrementBnhubBookingCompleted(bookingRow.listingId)
        );
      }

      void applyGuarantee(bookingId).catch((e) => logError("Webhook: BNHUB guarantee apply failed", e));

      const paymentUpdate = await prisma.payment
        .updateMany({
          where: { bookingId, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.COMPLETED,
            stripePaymentId:
              typeof session.payment_intent === "string" ? session.payment_intent : piId ?? sessionId,
            stripeCheckoutSessionId: sessionId,
            stripeReceiptUrl: stripeReceiptUrl ?? undefined,
            stripeCheckoutAmountCents: sessionAmountTotal,
            stripeCheckoutCurrency: sessionCurrency,
            platformFeeCents: platformFeeResolved,
            hostPayoutCents: hostPayoutResolved,
            ...(connectDestination ? { stripeConnectAccountId: connectDestination } : {}),
            linkedContractId: enforceableLink?.contractId ?? null,
            linkedContractType: enforceableLink?.contractType ?? null,
            scheduledHostPayoutAt: scheduledHostPayoutAt ?? undefined,
            paidAt: new Date(),
            ...(moneyBreakdownJson ? { moneyBreakdownJson } : {}),
          },
        })
        .catch((e) => {
          logError("Webhook: payment update failed", e);
          return { count: 0 };
        });

      if (paymentUpdate.count > 0) {
        const payUserId = typeof userId === "string" ? userId.trim() : "";
        const payListingId = typeof listingId === "string" ? listingId.trim() : "";
        const payBookingId = typeof bookingId === "string" ? bookingId.trim() : "";
        if (payBookingId && bookingRow?.guestId) {
          void recordGrowthEvent({
            eventName: GrowthEventName.BOOKING_COMPLETED,
            userId: bookingRow.guestId,
            idempotencyKey: `booking_paid:${payBookingId}`,
            metadata: {
              bookingId: payBookingId,
              listingId: bookingRow.listingId,
              amountCents: sessionAmountTotal ?? null,
              verifiedBy: "stripe_webhook",
            },
          }).catch(() => {});
          if (bookingRow.listingId && bookingRow.listing?.ownerId) {
            void import("@/modules/marketing-intelligence/activation.service")
              .then((m) =>
                m.emitBnhubBookingCompletedMarketing({
                  bookingId: payBookingId,
                  listingId: bookingRow.listingId,
                  guestUserId: bookingRow.guestId,
                  hostUserId: bookingRow.listing.ownerId,
                  amountCents: sessionAmountTotal ?? null,
                })
              )
              .catch(() => {});
          }
          void applyLoyaltyCreditForPaidBooking(prisma, {
            bookingId: payBookingId,
            guestUserId: bookingRow.guestId,
          }).then((r) => {
            if (r.ok && !r.skipped) {
              logInfo("[bnhub][loyalty] loyalty_credit_applied", {
                userId: bookingRow.guestId,
                bookingId: payBookingId,
              });
            }
          });
        }
        if (payBookingId) {
          void ensureBnhubBookingChecklist(payBookingId).catch((e) =>
            logError("Webhook: bnhub arrival checklist seed failed", e)
          );
        }
        if (payUserId && payListingId && payBookingId) {
          void persistLaunchEvent("PAYMENT_SUCCESS", {
            userId: payUserId,
            sessionId,
            amountCents: sessionAmountTotal,
            paymentType: "booking",
            listingId: payListingId,
            bookingId: payBookingId,
          });
          void persistLaunchEvent("CHECKOUT_SUCCESS", {
            userId: payUserId,
            sessionId,
            amountCents: sessionAmountTotal,
            paymentType: "booking",
            listingId: payListingId,
            bookingId: payBookingId,
          });
          void recordGrowthEventWithFunnel("booking_complete", {
            userId: payUserId,
            metadata: {
              bookingId: payBookingId,
              listingId: payListingId,
              amountCents: sessionAmountTotal,
            },
          });
          void recordLecipmManagerGrowthEvent("payment_completed", {
            userId: payUserId,
            listingId: payListingId,
            metadata: {
              bookingId: payBookingId,
              amountCents: sessionAmountTotal,
              stripeSessionId: sessionId,
            },
          });
          void recordLecipmManagerGrowthEvent("booking_confirmed", {
            userId: payUserId,
            listingId: payListingId,
            metadata: { bookingId: payBookingId, via: "stripe_checkout" },
          });
          void trackRevenueEvent({
            type: "booking",
            amountCents: platformFeeResolved,
            userId: payUserId,
            metadata: { bookingId: payBookingId, listingId: payListingId, paymentType: "booking" },
          });
          void trackFunnelEvent("booking_success", {
            bookingId: payBookingId,
            listingId: payListingId,
            platformFeeCents: platformFeeResolved,
          });
          void recordAnalyticsFunnelEvent({
            name: "payment_completed",
            listingId: payListingId,
            userId: payUserId,
            source: "stripe_checkout_session",
            metadata: {
              journey: "bnhub",
              bookingId: payBookingId,
              amountCents: sessionAmountTotal,
            },
          });
          void grantReferrerVisibilityBoostOnGuestBookingComplete(payUserId);
          logInfo(`[STRIPE] webhook_verified booking_updated: bookingId=${payBookingId} userId=${payUserId} paymentRowsUpdated=${paymentUpdate.count}`);
          void schedulePayoutFromBooking(payBookingId, hostPayoutResolved ?? undefined).catch((e) =>
            logError("Webhook: orchestrated payout schedule failed", e)
          );
          void persistMoneyEvent({
            type: "booking_paid",
            bookingId: payBookingId,
            amountCents: sessionAmountTotal,
            metadata: {
              stripeSessionId: sessionId,
              platformFeeCents: platformFeeResolved,
              hostPayoutCents: hostPayoutResolved,
            },
          });
        } else {
          logError("Webhook: PAYMENT_SUCCESS skipped — booking checkout.session.completed missing userId, listingId, or bookingId", {
            sessionId,
            hasUserId: Boolean(payUserId),
            hasListingId: Boolean(payListingId),
            hasBookingId: Boolean(payBookingId),
          });
        }
      } else if (bookingId && userId) {
        logInfo(
          `[STRIPE] duplicate_webhook_ignored: bookingId=${bookingId} sessionId=${sessionId} (payment row already completed or not pending)`,
        );
      }

      const legacyPaymentRow = await prisma.payment.findUnique({
        where: { bookingId },
        select: { id: true },
      });
      if (legacyPaymentRow) {
        await syncReservationPaymentPaidFromWebhook({
          bookingId,
          reservationPaymentId:
            typeof session.metadata?.bnhubReservationPaymentId === "string"
              ? session.metadata.bnhubReservationPaymentId
              : undefined,
          sessionAmountTotalCents: sessionAmountTotal,
          currency: sessionCurrency,
          stripeSessionId: sessionId,
          stripePaymentIntentId: piId,
          legacyPaymentId: legacyPaymentRow.id,
          platformFeeCents: platformFeeResolved,
          hostPayoutCents: hostPayoutResolved,
        }).catch((e) => logError("Webhook: marketplace payment sync failed", e));
      }

      await prisma.platformPayment
        .update({
          where: { id: platformPayment.id },
          data: {
            linkedContractId: enforceableLink?.contractId ?? null,
            linkedContractType: enforceableLink?.contractType ?? null,
            platformFeeCents: platformFeeResolved,
            hostPayoutCents: hostPayoutResolved,
          },
        })
        .catch((e) => logError("Webhook: platformPayment booking fee + contract link failed", e));

      logInfo("[STRIPE] [PAYMENT] SUCCESS", {
        event: "checkout.session.completed",
        stripeEventId: event.id,
        sessionId,
        paymentIntentId: piId,
        bookingId,
        listingId,
        userId,
        amountCents: sessionAmountTotal,
        currency: sessionCurrency,
        platformFeeCents: platformFeeResolved,
        hostPayoutCents: hostPayoutResolved,
        paymentType: "booking",
      });

      console.log("[REVENUE]", {
        type: "booking",
        amount: sessionAmountTotal / 100,
        platformFee: platformFeeResolved / 100,
        bookingId,
      });

      if (bookingRow && confirmationCode) {
        await prisma.bnhubBookingInvoice
          .upsert({
            where: { bookingId },
            create: {
              bookingId,
              stripeSessionId: sessionId,
              paymentIntentId: piId,
              guestNameSnapshot: bookingRow.guest.name,
              listingTitleSnapshot: bookingRow.listing.title,
              confirmationCode,
              totalAmountCents: sessionAmountTotal,
              platformFeeCents: platformFeeResolved,
              hostPayoutCents: hostPayoutResolved,
              stripeConnectAccountId: connectDestination,
              paymentStatus: "COMPLETED",
              linkedContractId: enforceableLink?.contractId ?? null,
              linkedContractType: enforceableLink?.contractType ?? null,
            },
            update: {
              stripeSessionId: sessionId,
              paymentIntentId: piId,
              guestNameSnapshot: bookingRow.guest.name,
              listingTitleSnapshot: bookingRow.listing.title,
              confirmationCode,
              totalAmountCents: sessionAmountTotal,
              platformFeeCents: platformFeeResolved,
              hostPayoutCents: hostPayoutResolved,
              stripeConnectAccountId: connectDestination ?? undefined,
              paymentStatus: "COMPLETED",
              issuedAt: new Date(),
              linkedContractId: enforceableLink?.contractId ?? null,
              linkedContractType: enforceableLink?.contractType ?? null,
            },
          })
          .catch((e) => logError("Webhook: bnhub invoice upsert failed", e));
      }

      const commissionEligible = !enforceableContractsRequired() || Boolean(enforceableLink);
      await prisma.platformCommissionRecord
        .create({
          data: {
            bookingId,
            contractId: enforceableLink?.contractId ?? undefined,
            commissionEligible,
            commissionSource: "BNHUB_BOOKING",
            commissionAmountCents: platformFeeResolved,
            platformShareCents: platformFeeResolved,
            partnerShareCents: hostPayoutResolved,
            metadata: {
              guestTermsLinked: Boolean(enforceableLink),
              enforceableContractsRequired: enforceableContractsRequired(),
            } as object,
          },
        })
        .catch((e) => logError("Webhook: platform commission record failed", e));

      void sendBnhubPostPaymentEmails(bookingId).catch((e) => logError("Webhook: BNHUB lifecycle emails failed", e));
      void import("@/lib/bnhub/bnhub-retention-followups")
        .then(({ createBnhubPostBookingRetentionNotification }) =>
          createBnhubPostBookingRetentionNotification(bookingId),
        )
        .catch((e) => logError("Webhook: BNHUB retention notification failed", e));

      void trackEvent(
        "payment_success",
        { bookingId, sessionId, paymentIntentId: piId, paymentType: "booking" },
        { userId }
      ).catch(() => {});
      logBusinessMilestone("PAYMENT SUCCESS", { bookingId, paymentIntentId: piId });
      void onPaymentSuccessAutomation(userId, {
        bookingId,
        sessionId,
        paymentIntentId: piId,
        paymentType: "booking",
      }).catch((e) => logError("Webhook: growth payment_success automation failed", e));

      void onBnhubBookingPaymentConfirmed(bookingId).catch((e) =>
        logError("Webhook: internal CRM booking telemetry failed", e),
      );

      void recordPlatformEvent({
        eventType: "bnhub_payment_completed",
        sourceModule: "stripe",
        entityType: "BOOKING",
        entityId: bookingId,
        payload: {
          platformFeeCents: platformFeeResolved,
          hostPayoutCents: hostPayoutResolved,
          connect: Boolean(connectDestination),
        },
      }).catch(() => {});

      await markStripeWebhookProcessed(event.id, BnhubMpWebhookInboxStatus.PROCESSED).catch((e) =>
        logError("Webhook: inbox mark processed failed", e)
      );

      await prisma.bnhubBookingEvent.create({
        data: {
          bookingId,
          eventType: "confirmed",
          actorId: userId,
          payload: { source: "stripe_webhook", sessionId },
        },
      }).catch(() => {});
    }

    if ((paymentType === "deposit" || paymentType === "closing_fee") && dealId) {
      const milestoneName = paymentType === "deposit" ? "Deposit" : "Closing";
      const existing = await prisma.dealMilestone.findFirst({
        where: { dealId, name: milestoneName },
      }).catch(() => null);
      if (existing) {
        await prisma.dealMilestone.update({
          where: { id: existing.id },
          data: { status: "completed", completedAt: new Date() },
        }).catch(() => {});
      } else {
        await prisma.dealMilestone.create({
          data: { dealId, name: milestoneName, status: "completed", completedAt: new Date() },
        }).catch(() => {});
      }
      if (paymentType === "closing_fee") {
        const prevDeal = await prisma.deal
          .findUnique({ where: { id: dealId }, select: { status: true } })
          .catch(() => null);
        await prisma.deal
          .update({
            where: { id: dealId },
            data: { status: "closed" },
          })
          .catch((e) => logError("Webhook: deal close failed", e));
        if (prevDeal && prevDeal.status !== "closed") {
          const { notifyDealClosedCelebrationIfNeeded } = await import("@/lib/listing-lifecycle/notify-deal-closed-celebration");
          void notifyDealClosedCelebrationIfNeeded(dealId).catch(() => null);
        }
      }
    }

    if (paymentType === "lead_unlock" && leadId) {
      if (projectId) {
        await prisma.projectLeadPayment.create({
          data: { projectId, leadId, amount: amountDollars },
        }).catch(() => {});
        await prisma.lead.update({
          where: { id: leadId },
          data: { contactUnlockedAt: new Date() },
        }).catch(() => {});
        void onLeadUnlockPaymentRecorded({
          leadId,
          brokerUserId: typeof userId === "string" ? userId : "",
          amountCents,
        }).catch(() => {});
      } else {
        const brokerMeta =
          typeof session.metadata?.brokerId === "string" ? session.metadata.brokerId.trim() : "";
        const prev = await prisma.lead
          .findUnique({
            where: { id: leadId },
            select: { introducedByBrokerId: true },
          })
          .catch(() => null);
        await prisma.lead
          .update({
            where: { id: leadId },
            data: {
              contactUnlockedAt: new Date(),
              contactUnlockedByUserId: userId as string,
              ...(prev && !prev.introducedByBrokerId && brokerMeta
                ? { introducedByBrokerId: brokerMeta }
                : {}),
            },
          })
          .catch((e) => logError("Webhook: CRM lead_unlock apply failed", e));
        await recordRevenueEventLedger({
          type: "lead_unlock",
          amountCents,
          userId: userId as string,
          metadata: { leadId, brokerId: brokerMeta || userId, source: "stripe_webhook" },
        }).catch(() => {});
        void onLeadUnlockPaymentRecorded({
          leadId,
          brokerUserId: (brokerMeta || (userId as string)) as string,
          amountCents,
        }).catch(() => {});
      }
    }

    if (paymentType === "lead_marketplace") {
      const marketplaceListingId = session.metadata?.marketplaceListingId as string | undefined;
      if (marketplaceListingId && userId) {
        const done = await completeLeadMarketplacePurchase(prisma, {
          marketplaceListingId,
          buyerUserId: userId,
          stripeSessionId: session.id,
        });
        if (!done.ok) {
          logError("Webhook: lead marketplace purchase not applied", {
            reason: done.reason,
            marketplaceListingId,
            userId,
          });
        } else {
          await prisma.trafficEvent
            .create({
              data: {
                eventType: "lead_purchased",
                path: "/dashboard/broker",
                source: "stripe_webhook",
                medium: "billing",
                meta: { userId, marketplaceListingId } as object,
              },
            })
            .catch(() => {});
        }
      }
    }

    if (paymentType === "broker_assigned_lead" && userId && piId) {
      const brokerLeadId = session.metadata?.brokerLeadId as string | undefined;
      if (brokerLeadId) {
        await applyBrokerAssignedLeadCheckoutSuccess(prisma, {
          payingBrokerId: userId,
          brokerLeadId,
          stripePaymentIntentId: piId,
          amountCents: sessionAmountTotal,
        }).catch((e) => logError("Webhook: broker assigned lead checkout apply failed", e));
      }
    }

    if (paymentType === "broker_lead_invoice" && userId && piId) {
      const brokerInvoiceId = session.metadata?.brokerInvoiceId as string | undefined;
      if (brokerInvoiceId) {
        await applyBrokerLeadInvoiceCheckoutSuccess(prisma, {
          payingBrokerId: userId,
          brokerInvoiceId,
          stripePaymentIntentId: piId,
          amountCents: sessionAmountTotal,
        }).catch((e) => logError("Webhook: broker lead invoice checkout apply failed", e));
      }
    }

    if (paymentType === "mortgage_contact_unlock") {
      const mortgageRequestId = session.metadata?.mortgageRequestId as string | undefined;
      const mortgageBrokerId = session.metadata?.mortgageBrokerId as string | undefined;
      if (mortgageRequestId && mortgageBrokerId && userId) {
        const unlockResult = await applyMortgageContactUnlock({
          mortgageRequestId,
          mortgageBrokerId,
          payingUserId: userId,
          amountCents: sessionAmountTotal,
          source: "paid",
        });
        if (!unlockResult.ok) {
          logError("Webhook: mortgage contact unlock rejected after payment", {
            reason: unlockResult.reason,
            mortgageRequestId,
            mortgageBrokerId,
          });
        }
      }
    }

    if (paymentType === "fsbo_publish") {
      const fsboListingId = session.metadata?.fsboListingId as string | undefined;
      const metaPlan = session.metadata?.fsboPlan as string | undefined;
      const publishPlan = metaPlan === "premium" ? "premium" : "basic";
      const featuredUntil =
        publishPlan === "premium"
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          : null;

      await prisma.platformPayment
        .update({
          where: { id: platformPayment.id },
          data: {
            fsboListingId: fsboListingId ?? null,
            platformFeeCents: sessionAmountTotal,
            hostPayoutCents: 0,
          },
        })
        .catch((e) => logError("Webhook: platformPayment FSBO fee record failed", e));

      if (fsboListingId && userId) {
        const { ensureFsboListingDocumentSlots } = await import("@/lib/fsbo/seller-hub-seed-documents");
        const { ensureFsboListingListingCode } = await import("@/lib/fsbo/ensure-fsbo-listing-code");
        const { assertSellerHubSubmitReady } = await import("@/lib/fsbo/seller-hub-validation");
        const { recordPlatformEvent } = await import("@/lib/observability");
        await ensureFsboListingDocumentSlots(fsboListingId).catch(() => {});
        await prisma.$transaction(async (tx) => {
          await ensureFsboListingListingCode(tx, fsboListingId);
        });
        const listingFull = await prisma.fsboListing.findUnique({
          where: { id: fsboListingId },
          include: { documents: true, sellerSupportingDocuments: { select: { category: true, status: true, declarationSectionKey: true } } },
        });
        if (!listingFull || listingFull.ownerId !== userId) {
          logError("Webhook: FSBO listing missing or owner mismatch for publish", { fsboListingId, userId });
        } else {
          const submitGate = await assertSellerHubSubmitReady(
            listingFull,
            listingFull.documents,
            listingFull.sellerSupportingDocuments
          );
          if (!submitGate.ok) {
            logError("Webhook: FSBO activation blocked — seller publish gates not satisfied", {
              fsboListingId,
              errors: submitGate.errors,
            });
          } else {
            const activated = await prisma.fsboListing
              .updateMany({
                where: { id: fsboListingId, ownerId: userId, status: "DRAFT" },
                data: {
                  status: "ACTIVE",
                  moderationStatus: "APPROVED",
                  rejectReason: null,
                  publishPlan,
                  publishPriceCents: sessionAmountTotal,
                  paidPublishAt: new Date(),
                  featuredUntil,
                },
              })
              .catch((e) => {
                logError("Webhook: fsbo publish activation failed", e);
                return { count: 0 };
              });
            void recordPlatformEvent({
              eventType: "listing_activated",
              sourceModule: "fsbo",
              entityType: "FSBO_LISTING",
              entityId: fsboListingId,
              payload: { publishPlan, source: "stripe_webhook" },
            }).catch(() => {});
            await syncFsboListingExpiryState(fsboListingId, { sendReminder: false }).catch(() => null);
            if (activated && activated.count > 0) {
              const { notifyFsboListingActivatedIfNeeded } = await import("@/lib/listing-lifecycle/notify-fsbo-listing-activated");
              void notifyFsboListingActivatedIfNeeded(fsboListingId).catch(() => null);
            }
          }
        }
      }
    }

    if (paymentType === "featured_listing" && userId) {
      const fsboListingId = session.metadata?.fsboListingId as string | undefined;
      const featuredPlanKey = (session.metadata?.featuredPlanKey as string | undefined) ?? "featured_fsbo_30d";
      const bnhubListingId = session.metadata?.listingId as string | undefined;
      const custRaw = session.customer;
      const stripeCustomerId =
        typeof custRaw === "string"
          ? custRaw
          : custRaw && typeof custRaw === "object" && custRaw !== null && "id" in custRaw
            ? String((custRaw as { id: string }).id)
            : null;
      if (fsboListingId) {
        const r = await fulfillFsboFeaturedFromStripeSession(prisma, {
          payerUserId: userId,
          fsboListingId,
          amountCents: sessionAmountTotal,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: piId,
          stripeCustomerId,
          featuredPlanKey,
        });
        if (!r.ok) {
          logError("Webhook: FSBO featured listing fulfillment failed", {
            reason: r.reason,
            fsboListingId,
            sessionId,
          });
        }
      } else if (bnhubListingId) {
        const r = await fulfillFeaturedListingFromWebhook(prisma, {
          payerUserId: userId,
          shortTermListingId: bnhubListingId,
          amountCents: sessionAmountTotal,
          platformPaymentId: platformPayment.id,
        });
        if (!r.ok) {
          logError("Webhook: BNHub featured listing fulfillment failed", {
            reason: r.reason,
            listingId: bnhubListingId,
            sessionId,
          });
        }
      }
    }

    await getOrCreateCommissionRules().catch(() => {});
    const commissionResult = await createCommissionsForPayment({
      paymentId: platformPayment.id,
      paymentType,
      amountCents,
      brokerId: brokerId ?? null,
    }).catch((e) => {
      logError("Webhook: commission creation failed", e);
      return null;
    });

    const platformAmt = commissionResult?.platformAmountCents ?? amountCents;
    const brokerAmt = commissionResult?.brokerAmountCents ?? 0;

    if (commissionResult) {
      void recordPlatformEvent({
        eventType: "commission_generated",
        sourceModule: "stripe",
        entityType: "BROKER_COMMISSION",
        entityId: commissionResult.id,
        payload: {
          paymentId: platformPayment.id,
          paymentType,
          platformAmountCents: commissionResult.platformAmountCents,
          brokerAmountCents: commissionResult.brokerAmountCents,
        },
      }).catch(() => {});
      await createRevenueLedgerForPayment({
        platformPaymentId: platformPayment.id,
        paymentType,
        platformAmountCents: commissionResult.platformAmountCents,
        brokerAmountCents: commissionResult.brokerAmountCents,
        brokerId: brokerId ?? null,
        brokerCommissionId: commissionResult.id,
        dealId: dealId ?? null,
        listingId: listingId ?? null,
        currency: platformPayment.currency,
      }).catch((e) => logError("Webhook: revenue ledger failed", e));
    } else if (amountCents > 0) {
      await prisma.partyRevenueLedgerEntry
        .create({
          data: {
            platformPaymentId: platformPayment.id,
            party: "PLATFORM",
            category: "platform_payment_full_gross",
            amountCents,
            currency: platformPayment.currency,
            dealId: dealId ?? null,
            listingId: listingId ?? null,
          },
        })
        .catch((e) => logError("Webhook: revenue ledger fallback failed", e));
    }

    void recordPlatformEvent({
      eventType: "payment_received",
      sourceModule: "stripe",
      entityType: "PLATFORM_PAYMENT",
      entityId: platformPayment.id,
      payload: {
        paymentType,
        amountCents: sessionAmountTotal,
        userId: userId ?? null,
      },
    }).catch(() => {});

    let finSettings: Awaited<ReturnType<typeof getPlatformFinancialSettings>> | null = null;
    try {
      finSettings = await getPlatformFinancialSettings();
    } catch (e) {
      logError("Webhook: platform financial settings failed", e);
    }
    const platformTaxNote = process.env.PLATFORM_TAX_REGISTRATION_NOTE?.trim() || null;
    const taxMode = (process.env.INVOICE_TAX_MODE === "INCLUSIVE" ? "INCLUSIVE" : "EXCLUSIVE") as "EXCLUSIVE" | "INCLUSIVE";

    if (finSettings) {
      const fin = finSettings;
      try {
        const year = new Date().getFullYear();
        const paymentOk = platformPayment.status === "paid";
        const invStatus = paymentOk ? PlatformInvoiceStatus.PAID : PlatformInvoiceStatus.ISSUED;
        const paidAt = paymentOk ? new Date() : null;

        await prisma.$transaction(async (tx) => {
          const inv = buildInvoiceForPlatformPayment({
            stripeAmountCents: amountCents,
            platformAmountCents: platformAmt,
            brokerAmountCents: brokerAmt,
            paymentType,
            settings: fin,
            taxMode,
            brokerTaxSnapshot,
            platformTaxNote,
            currency: platformPayment.currency,
            taxOverrideJson: platformPayment.taxOverrideJson,
          });
          await tx.platformPayment.update({
            where: { id: platformPayment.id },
            data: { taxCalculationJson: inv.taxCalculationJson as object },
          });

          const tentative = buildSplitIssuerInvoiceRecords({
            combined: inv,
            settings: fin,
            brokerTaxSnapshot,
            platformTaxNote,
            payerUserId: userId,
            brokerUserId: brokerId ?? null,
            paymentId: platformPayment.id,
            currency: platformPayment.currency,
            year,
          });
          const platformInvoiceNumber = tentative.platform
            ? await generateInvoiceNumber(tx, year)
            : undefined;
          const brokerInvoiceNumber = tentative.broker
            ? await generateInvoiceNumber(tx, year)
            : undefined;
          const split = buildSplitIssuerInvoiceRecords({
            combined: inv,
            settings: fin,
            brokerTaxSnapshot,
            platformTaxNote,
            payerUserId: userId,
            brokerUserId: brokerId ?? null,
            paymentId: platformPayment.id,
            currency: platformPayment.currency,
            year,
            platformInvoiceNumber,
            brokerInvoiceNumber,
          });

          if (split.platform) {
            await tx.platformInvoice.create({
              data: {
                paymentId: platformPayment.id,
                invoiceIssuer: split.platform.invoiceIssuer,
                invoiceLabel: split.platform.invoiceLabel,
                userId: split.platform.userId,
                invoiceNumber: split.platform.invoiceNumber,
                status: invStatus,
                hubSource: paymentType,
                amountCents: split.platform.amountCents,
                currency: platformPayment.currency,
                invoiceTaxDetails: split.platform.invoiceTaxDetails as object,
                subtotalCents: split.platform.subtotalCents,
                gstCents: split.platform.gstCents,
                qstCents: split.platform.qstCents,
                totalCents: split.platform.totalCents,
                invoiceLines: split.platform.invoiceLines as object,
                taxMode: split.platform.taxMode,
                issuedAt: new Date(),
                paidAt,
              },
            });
          }
          if (split.broker) {
            await tx.platformInvoice.create({
              data: {
                paymentId: platformPayment.id,
                invoiceIssuer: split.broker.invoiceIssuer,
                invoiceLabel: split.broker.invoiceLabel,
                userId: split.broker.userId,
                invoiceNumber: split.broker.invoiceNumber,
                status: invStatus,
                hubSource: paymentType,
                amountCents: split.broker.amountCents,
                currency: platformPayment.currency,
                invoiceTaxDetails: split.broker.invoiceTaxDetails as object,
                subtotalCents: split.broker.subtotalCents,
                gstCents: split.broker.gstCents,
                qstCents: split.broker.qstCents,
                totalCents: split.broker.totalCents,
                invoiceLines: split.broker.invoiceLines as object,
                taxMode: split.broker.taxMode,
                issuedAt: new Date(),
                paidAt,
              },
            });
          }
          if (!split.platform && !split.broker) {
            const invoiceNumber = await generateInvoiceNumber(tx, year);
            await tx.platformInvoice.create({
              data: {
                paymentId: platformPayment.id,
                invoiceIssuer: "PLATFORM",
                invoiceLabel: "Payment invoice",
                userId,
                invoiceNumber,
                status: invStatus,
                hubSource: paymentType,
                amountCents: platformPayment.amountCents,
                currency: platformPayment.currency,
                invoiceTaxDetails: inv.invoiceTaxDetails as object,
                subtotalCents: inv.subtotalCents,
                gstCents: inv.gstCents,
                qstCents: inv.qstCents,
                totalCents: inv.totalCents,
                invoiceLines: inv.invoiceLines as object,
                taxMode: inv.taxMode,
                issuedAt: new Date(),
                paidAt,
              },
            });
          }
        });
      } catch (e) {
        logError("Webhook: invoice / tax build failed", e);
        const { buildInvoiceTaxDetails } = await import("@/lib/tax/platform-invoice-tax");
        const year = new Date().getFullYear();
        const paymentOk = platformPayment.status === "paid";
        await prisma.$transaction(async (tx) => {
          const invoiceNumber = await generateInvoiceNumber(tx, year);
          await tx.platformInvoice.create({
            data: {
              paymentId: platformPayment.id,
              invoiceIssuer: "PLATFORM",
              invoiceLabel: "Payment invoice (fallback)",
              userId,
              invoiceNumber,
              status: paymentOk ? PlatformInvoiceStatus.PAID : PlatformInvoiceStatus.ISSUED,
              hubSource: paymentType,
              amountCents: platformPayment.amountCents,
              currency: platformPayment.currency,
              invoiceTaxDetails: buildInvoiceTaxDetails(
                brokerTaxSnapshot,
                platformTaxNote,
                fin.legalName,
                fin.platformGstNumber,
                fin.platformQstNumber
              ) as object,
              issuedAt: new Date(),
              paidAt: paymentOk ? new Date() : null,
            },
          });
        }).catch(() => {});
      }
    } else {
      const { buildInvoiceTaxDetails } = await import("@/lib/tax/platform-invoice-tax");
      const envReg = getPlatformTaxRegistrationFromEnvironment();
      const year = new Date().getFullYear();
      const paymentOk = platformPayment.status === "paid";
      await prisma.$transaction(async (tx) => {
        const invoiceNumber = await generateInvoiceNumber(tx, year);
        await tx.platformInvoice.create({
          data: {
            paymentId: platformPayment.id,
            invoiceIssuer: "PLATFORM",
            invoiceLabel: "Payment invoice (fallback)",
            userId,
            invoiceNumber,
            status: paymentOk ? PlatformInvoiceStatus.PAID : PlatformInvoiceStatus.ISSUED,
            hubSource: paymentType,
            amountCents: platformPayment.amountCents,
            currency: platformPayment.currency,
            invoiceTaxDetails: buildInvoiceTaxDetails(
              brokerTaxSnapshot,
              platformTaxNote,
              envReg.legalName,
              envReg.platformGstNumber,
              envReg.platformQstNumber
            ) as object,
            issuedAt: new Date(),
            paidAt: paymentOk ? new Date() : null,
          },
        });
      }).catch(() => {});
    }

    void recordPlatformEvent({
      eventType: "payment_completed",
      entityType: "PLATFORM_PAYMENT",
      entityId: platformPayment.id,
      payload: { paymentType, amountCents, bookingId, dealId },
    });
    return Response.json({ received: true, platformPaymentId: platformPayment.id });
  }

  // Project lead unlock: create payment record and unlock contact
  if (metadataType === "project_lead" && projectId && leadId) {
    const existing = await prisma.projectLeadPayment.findFirst({
      where: { leadId, projectId },
    });
    if (!existing) {
      await prisma.projectLeadPayment.create({
        data: { projectId, leadId, amount: amountDollars },
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { contactUnlockedAt: new Date() },
      });
    }
    if (userId) {
      await rewardReferralActivation(userId).catch(() => {});
      if (referralAttributionCode) {
        await prisma.referralEvent
          .create({ data: { code: referralAttributionCode, eventType: "paid", userId } })
          .catch(() => {});
      }
    }
    if (userId) {
      await addCommissionForReferral(userId, "lead-unlock", leadId, amountDollars).catch(() => {});
    }
    return Response.json({ received: true, projectLeadUnlocked: true });
  }

  // Project premium or subscription: update subscription plan + featured
  if ((metadataType === "project_premium" || metadataType === "project_subscription") && projectId) {
    const plan = (session.metadata?.plan as string) || (metadataType === "project_premium" ? "premium" : "basic");
    await prisma.projectSubscription.upsert({
      where: { projectId },
      create: {
        projectId,
        isTrial: false,
        trialEnd: new Date(),
        plan,
        isActive: true,
      },
      update: { isTrial: false, plan, isActive: true },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { featured: plan === "premium" },
    });
    if (referralAttributionCode && userId) {
      await prisma.referralEvent
        .create({ data: { code: referralAttributionCode, eventType: "paid", userId } })
        .catch(() => {});
    }
    if (userId) {
      await rewardReferralActivation(userId).catch(() => {});
      await addCommissionForReferral(userId, plan === "premium" ? "premium" : "subscription", projectId, amountDollars).catch(() => {});
    }
    return Response.json({ received: true, projectSubscriptionUpdated: true });
  }
  const feature = (session.metadata?.feature as string) || metadataType;

  if (!userId) {
    logInfo("Stripe webhook: checkout.session.completed not handled (no userId in metadata)", {
      sessionId: session.id,
      paymentType: paymentType ?? null,
      metadataType: metadataType ?? null,
    });
    return Response.json({
      received: true,
      ignored: "no_user_id",
      detail: "No LECIPM handler matched; Stripe CLI and third-party checkouts often omit userId.",
    });
  }

  const sessionId = session.id;
  // Design access: one-time $5 to unlock design features after trial
  if (feature === "design_access") {
    const existingInvoice = await prisma.upgradeInvoice.findUnique({
      where: { stripePaymentId: sessionId },
    });
    if (!existingInvoice) {
      await prisma.upgradeInvoice.create({
        data: {
          userId,
          amount: amountDollars,
          plan: "design-access",
          stripePaymentId: sessionId,
        },
      });
    }
    const updated = await prisma.designAccess.updateMany({
      where: { userId },
      data: { isPaid: true },
    });
    await prisma.billingAuditLog.create({
      data: {
        event: "checkout.session.completed",
        userId,
        stripeSessionId: sessionId,
        feature: "design_access",
        plan: "design-access",
        amount: amountDollars,
        details: { paymentStatus: session.payment_status, amountTotal },
      },
    });
    await sendPaymentSuccessEmail(userId);
    void import("@/modules/marketing-intelligence/activation.service")
      .then((m) =>
        m.emitStripeCheckoutCompletedMarketing({
          userId,
          amountCents: Math.round(amountDollars * 100),
          stripeSessionId: sessionId,
          feature: "design_access",
        })
      )
      .catch(() => {});
    return Response.json({ received: true, designAccessPaid: updated.count > 0 });
  }

  const plan = ((session.metadata?.plan as string) || "basic") as PlanKey;
  if (!VALID_PLANS.includes(plan)) {
    logInfo("Stripe webhook: checkout.session.completed not handled (unknown plan / feature)", {
      sessionId: session.id,
      userId,
      feature: feature ?? null,
      plan,
    });
    return Response.json({
      received: true,
      ignored: "unknown_plan_or_feature",
      detail: "Session is not design_access, storage-upgrade, or a valid subscription plan (basic|pro).",
    });
  }

  // Idempotency: do not create duplicate invoice or apply upgrade twice
  const existingInvoice = await prisma.upgradeInvoice.findUnique({
    where: { stripePaymentId: sessionId },
  });
  if (existingInvoice) {
    return Response.json({ received: true, duplicate: true });
  }

  // Mark payment as paid by creating the invoice record
  await prisma.upgradeInvoice.create({
    data: {
      userId,
      amount: amountDollars,
      plan,
      stripePaymentId: sessionId,
    },
  });
  if (referralAttributionCode) {
    await prisma.referralEvent
      .create({ data: { code: referralAttributionCode, eventType: "paid", userId } })
      .catch(() => {});
  }

  await rewardReferralActivation(userId).catch(() => {});
  await addCommissionForReferral(userId, feature === STORAGE_UPGRADE_FEATURE ? "premium" : "subscription", sessionId, amountDollars).catch(() => {});

  // Upgrade storage when feature/type is storage-upgrade (do not unlock on success page)
  if (feature === STORAGE_UPGRADE_FEATURE) {
    const planConfig = plans[plan as PlanKey];
    const limitBytes = planConfig.storage;

    await prisma.userStorage.upsert({
      where: { userId },
      create: {
        userId,
        usedBytes: 0,
        limitBytes,
      },
      update: { limitBytes },
    });

    await prisma.user.updateMany({
      where: { id: userId },
      data: { plan },
    });
  }

  // Audit log
  await prisma.billingAuditLog.create({
    data: {
      event: "checkout.session.completed",
      userId,
      stripeSessionId: sessionId,
      feature: feature ?? null,
      plan,
      amount: amountDollars,
      details: {
        paymentStatus: session.payment_status,
        amountTotal,
      },
    },
  });

  await sendPaymentSuccessEmail(userId);
  return Response.json({ received: true, upgraded: feature === STORAGE_UPGRADE_FEATURE });
}
