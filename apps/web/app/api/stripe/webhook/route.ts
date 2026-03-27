import { NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { PlatformInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/codes/generate-code";
import { plans, type PlanKey } from "@/lib/billing/plans";
import { getResend, isResendConfigured, getFromEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/logger";
import { addCommissionForReferral, rewardReferralActivation } from "@/lib/referrals";
import { createCommissionsForPayment, getOrCreateCommissionRules } from "@/lib/stripe/commission";
import { recordPlatformEvent } from "@/lib/observability";
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
import { sendBnhubPostPaymentEmails } from "@/lib/email/bnhub-lifecycle-emails";
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
import { syncReservationPaymentPaidFromWebhook } from "@/modules/bnhub-payments/services/paymentService";
import {
  markStripeWebhookProcessed,
  recordStripeWebhookReceived,
} from "@/modules/bnhub-payments/infrastructure/stripeWebhookInbox";
import { BnhubMpWebhookInboxStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = ["basic", "pro"];
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
  logInfo("Stripe webhook handler: ready");

  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env" },
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
    logError("Stripe webhook signature verification failed", message);
    return Response.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  void recordStripeWebhookReceived(event).catch((e) => logError("bnhub webhook inbox record failed", e));

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    const refundCents = charge.amount_refunded ?? 0;
    if (paymentIntentId) {
      await prisma.payment
        .updateMany({
          where: { stripePaymentId: paymentIntentId },
          data: { status: "REFUNDED" },
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
    }
    return Response.json({ received: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    void recordPlatformEvent({
      eventType: "payment_failed",
      entityType: "PAYMENT_INTENT",
      entityId: pi.id,
      payload: { error: pi.last_payment_error?.message },
    });
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

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadataType = session.metadata?.type as string;
  const paymentType = session.metadata?.paymentType as string | undefined;
  const userId = session.metadata?.userId;
  const projectId = session.metadata?.projectId as string | undefined;
  const leadId = session.metadata?.leadId as string | undefined;
  const amountTotal = session.amount_total ?? 0;
  const amountDollars = amountTotal / 100;
  const amountCents = amountTotal;
  const referral = userId
    ? await prisma.referral.findFirst({ where: { usedByUserId: userId }, select: { code: true } }).catch(() => null)
    : null;

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
  ];
  if (paymentType && PLATFORM_PAYMENT_TYPES.includes(paymentType) && userId) {
    const sessionId = session.id;
    const existingPayment = await prisma.platformPayment.findUnique({
      where: { stripeSessionId: sessionId },
    });
    if (existingPayment) {
      return Response.json({ received: true, duplicate: true });
    }

    const listingId = session.metadata?.listingId as string | undefined;
    const bookingId = session.metadata?.bookingId as string | undefined;
    const dealId = session.metadata?.dealId as string | undefined;
    const brokerId = session.metadata?.brokerId as string | undefined;

    if (paymentType === "booking" && bookingId) {
      const bookingCheck = await assertBookingStripeWebhookValid({
        bookingId,
        metadataUserId: userId,
        amountTotalCents: amountCents,
      });
      if (!bookingCheck.ok) {
        logError("Webhook: booking payment rejected — no DB updates", {
          reason: bookingCheck.reason,
          bookingId,
          userId,
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
        include: {
          guest: { select: { name: true } },
          listing: { select: { title: true } },
        },
      });

      const scheduledHostPayoutAt = bookingRow
        ? new Date(bookingRow.checkIn.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;

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

      void applyGuarantee(bookingId).catch((e) => logError("Webhook: BNHub guarantee apply failed", e));

      await prisma.payment
        .updateMany({
          where: { bookingId },
          data: {
            status: "COMPLETED",
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
          },
        })
        .catch((e) => logError("Webhook: payment update failed", e));

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
          },
        })
        .catch((e) => logError("Webhook: platformPayment contract link failed", e));

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

      void sendBnhubPostPaymentEmails(bookingId).catch((e) => logError("Webhook: BNHub lifecycle emails failed", e));

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

      void markStripeWebhookProcessed(event.id, BnhubMpWebhookInboxStatus.PROCESSED).catch((e) =>
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
        await prisma.deal.update({
          where: { id: dealId },
          data: { status: "closed" },
        }).catch((e) => logError("Webhook: deal close failed", e));
      }
    }

    if (paymentType === "lead_unlock" && projectId && leadId) {
      await prisma.projectLeadPayment.create({
        data: { projectId, leadId, amount: amountDollars },
      }).catch(() => {});
      await prisma.lead.update({
        where: { id: leadId },
        data: { contactUnlockedAt: new Date() },
      }).catch(() => {});
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
          include: { documents: true },
        });
        if (!listingFull || listingFull.ownerId !== userId) {
          logError("Webhook: FSBO listing missing or owner mismatch for publish", { fsboListingId, userId });
        } else {
          const submitGate = await assertSellerHubSubmitReady(listingFull, listingFull.documents);
          if (!submitGate.ok) {
            logError("Webhook: FSBO activation blocked — seller publish gates not satisfied", {
              fsboListingId,
              errors: submitGate.errors,
            });
          } else {
            await prisma.fsboListing
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
              .catch((e) => logError("Webhook: fsbo publish activation failed", e));
            void recordPlatformEvent({
              eventType: "listing_activated",
              sourceModule: "fsbo",
              entityType: "FSBO_LISTING",
              entityId: fsboListingId,
              payload: { publishPlan, source: "stripe_webhook" },
            }).catch(() => {});
          }
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
      if (referral?.code) {
        await prisma.referralEvent.create({ data: { code: referral.code, eventType: "paid", userId } }).catch(() => {});
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
    if (referral?.code && userId) {
      await prisma.referralEvent.create({ data: { code: referral.code, eventType: "paid", userId } }).catch(() => {});
    }
    if (userId) {
      await rewardReferralActivation(userId).catch(() => {});
      await addCommissionForReferral(userId, plan === "premium" ? "premium" : "subscription", projectId, amountDollars).catch(() => {});
    }
    return Response.json({ received: true, projectSubscriptionUpdated: true });
  }
  const feature = (session.metadata?.feature as string) || metadataType;

  if (!userId) {
    console.error("Webhook missing userId in metadata", { userId });
    return Response.json(
      { error: "Invalid session metadata" },
      { status: 400 }
    );
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
    return Response.json({ received: true, designAccessPaid: updated.count > 0 });
  }

  const plan = ((session.metadata?.plan as string) || "basic") as PlanKey;
  if (!VALID_PLANS.includes(plan)) {
    console.error("Webhook invalid plan in metadata", { plan });
    return Response.json(
      { error: "Invalid session metadata" },
      { status: 400 }
    );
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
  if (referral?.code) {
    await prisma.referralEvent.create({ data: { code: referral.code, eventType: "paid", userId } }).catch(() => {});
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
