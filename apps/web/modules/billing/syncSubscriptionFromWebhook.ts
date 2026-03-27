import type Stripe from "stripe";
import type { PrismaClient } from "@prisma/client";
import { BillingEventType, Prisma, SubscriptionStatus } from "@prisma/client";
import { logError, logInfo } from "@/lib/logger";
import { LECIPM_WORKSPACE_CHECKOUT } from "@/modules/billing/constants";
import { mrrCentsFromStripeSubscription } from "@/modules/billing/stripeMrrCents";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseWorkspaceId(meta: Stripe.Metadata | null | undefined): string | null {
  const raw = meta?.workspaceId?.trim();
  if (raw && UUID_RE.test(raw)) return raw;
  return null;
}

function mapStripeEventToBillingEventType(stripeType: string): BillingEventType | null {
  const m: Record<string, BillingEventType> = {
    "checkout.session.completed": BillingEventType.checkout_completed,
    "customer.subscription.created": BillingEventType.subscription_created,
    "customer.subscription.updated": BillingEventType.subscription_updated,
    "customer.subscription.deleted": BillingEventType.subscription_deleted,
    "invoice.payment_failed": BillingEventType.invoice_payment_failed,
    "invoice.paid": BillingEventType.invoice_paid,
  };
  return m[stripeType] ?? null;
}

async function recordWorkspaceBillingEvent(
  db: PrismaClient,
  args: {
    stripeEvent: Stripe.Event;
    eventType: BillingEventType;
    subscriptionId?: string | null;
    workspaceId?: string | null;
    userId?: string | null;
  }
): Promise<void> {
  try {
    await db.billingEvent.create({
      data: {
        subscriptionId: args.subscriptionId ?? null,
        workspaceId: args.workspaceId ?? null,
        userId: args.userId ?? null,
        eventType: args.eventType,
        stripeEventId: args.stripeEvent.id,
        payload: args.stripeEvent as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    logError("recordWorkspaceBillingEvent failed", e);
  }
}

function stripeStatusToEnum(stripeStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    trialing: SubscriptionStatus.trialing,
    active: SubscriptionStatus.active,
    past_due: SubscriptionStatus.past_due,
    canceled: SubscriptionStatus.canceled,
    unpaid: SubscriptionStatus.unpaid,
    incomplete: SubscriptionStatus.incomplete,
    incomplete_expired: SubscriptionStatus.incomplete_expired,
    paused: SubscriptionStatus.paused,
  };
  return map[stripeStatus] ?? SubscriptionStatus.unpaid;
}

function planCodeFromSubscription(sub: Stripe.Subscription): string {
  const meta = sub.metadata?.planCode?.trim();
  if (meta) return meta;
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && process.env.STRIPE_PRICE_LECIPM_PRO === priceId) return "pro";
  return "pro";
}

/**
 * Upsert local mirror row from Stripe Subscription (webhook source of truth).
 */
export async function syncWorkspaceSubscriptionFromStripeSubscription(
  db: PrismaClient,
  sub: Stripe.Subscription,
  userIdHint: string | null
): Promise<void> {
  const userId = userIdHint ?? sub.metadata?.userId?.trim() ?? null;
  const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const status = stripeStatusToEnum(sub.status);
  const planCode = planCodeFromSubscription(sub);
  const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : null;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const stripePriceId = sub.items.data[0]?.price?.id ?? null;
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const workspaceId = parseWorkspaceId(sub.metadata);
  const mrrCents = mrrCentsFromStripeSubscription(sub);

  await db.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      workspaceId,
      stripeCustomerId: custId,
      stripeSubscriptionId: sub.id,
      stripePriceId,
      planCode,
      mrrCents,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      metadata: { source: "stripe_webhook", stripeStatus: sub.status } as object,
    },
    update: {
      userId: userId ?? undefined,
      workspaceId: workspaceId ?? undefined,
      stripeCustomerId: custId ?? undefined,
      stripePriceId: stripePriceId ?? undefined,
      planCode,
      mrrCents: mrrCents ?? undefined,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      metadata: { source: "stripe_webhook", stripeStatus: sub.status } as object,
    },
  });

  logInfo("Workspace Stripe subscription synced", {
    subscriptionId: sub.id,
    userId,
    status,
    planCode,
  });
}

/**
 * @returns true when this event was a LECIPM workspace subscription (not mortgage expert / other).
 */
export async function handleWorkspaceSubscriptionStripeEvent(
  _stripe: Stripe,
  event: Stripe.Event,
  db: PrismaClient
): Promise<boolean> {
  const types = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!types.includes(event.type)) {
    return false;
  }

  const sub = event.data.object as Stripe.Subscription;
  const isWorkspace =
    sub.metadata?.lecipmWorkspace === "true" ||
    sub.metadata?.paymentType === LECIPM_WORKSPACE_CHECKOUT;

  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true },
  });

  if (!isWorkspace && !existing) {
    return false;
  }

  const billingType = mapStripeEventToBillingEventType(event.type);

  if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
    await db.subscription
      .updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: SubscriptionStatus.canceled,
          currentPeriodEnd: sub.ended_at ? new Date(sub.ended_at * 1000) : new Date(),
        },
      })
      .catch((e: unknown) => logError("Workspace subscription delete sync failed", e));

    const local = await db.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true, workspaceId: true, userId: true },
    });
    if (billingType) {
      await recordWorkspaceBillingEvent(db, {
        stripeEvent: event,
        eventType: billingType,
        subscriptionId: local?.id ?? null,
        workspaceId: local?.workspaceId ?? null,
        userId: local?.userId ?? null,
      });
    }
    const churnedUserId = local?.userId ?? sub.metadata?.userId?.trim() ?? null;
    if (churnedUserId) {
      captureServerEvent(churnedUserId, AnalyticsEvents.CHURN_DETECTED, {
        stripeSubscriptionId: sub.id,
        workspaceId: local?.workspaceId ?? null,
      });
    }
    return true;
  }

  const userId = sub.metadata?.userId?.trim() ?? null;
  await syncWorkspaceSubscriptionFromStripeSubscription(db, sub, userId);

  const local = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true, workspaceId: true, userId: true },
  });
  if (billingType) {
    await recordWorkspaceBillingEvent(db, {
      stripeEvent: event,
      eventType: billingType,
      subscriptionId: local?.id ?? null,
      workspaceId: local?.workspaceId ?? null,
      userId: local?.userId ?? null,
    });
  }
  return true;
}

/**
 * Mark workspace subscription past_due from failed invoice (if it is a LECIPM workspace sub).
 */
export async function handleWorkspaceInvoicePaymentFailed(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  event: Stripe.Event,
  db: PrismaClient
): Promise<boolean> {
  const subRef = invoice.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return false;

  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(subId);
  } catch (e) {
    logError("Workspace invoice.failed: retrieve subscription failed", e);
    return false;
  }

  const isWorkspace =
    sub.metadata?.lecipmWorkspace === "true" ||
    sub.metadata?.paymentType === LECIPM_WORKSPACE_CHECKOUT;
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!isWorkspace && !existing) return false;

  await db.subscription
    .updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: SubscriptionStatus.past_due,
        metadata: { lastInvoiceId: invoice.id, lastPaymentFailedAt: new Date().toISOString() } as object,
      },
    })
    .catch((e: unknown) => logError("Workspace subscription past_due sync failed", e));

  const local = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true, workspaceId: true, userId: true },
  });
  await recordWorkspaceBillingEvent(db, {
    stripeEvent: event,
    eventType: BillingEventType.invoice_payment_failed,
    subscriptionId: local?.id ?? null,
    workspaceId: local?.workspaceId ?? null,
    userId: local?.userId ?? null,
  });

  return true;
}

/**
 * Refresh workspace subscription from Stripe after successful invoice payment; records audit row.
 */
export async function handleWorkspaceInvoicePaid(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  event: Stripe.Event,
  db: PrismaClient
): Promise<boolean> {
  const subRef = invoice.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subId) return false;

  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(subId);
  } catch (e) {
    logError("Workspace invoice.paid: retrieve subscription failed", e);
    return false;
  }

  const isWorkspace =
    sub.metadata?.lecipmWorkspace === "true" ||
    sub.metadata?.paymentType === LECIPM_WORKSPACE_CHECKOUT;
  const existing = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!isWorkspace && !existing) return false;

  const userId = sub.metadata?.userId?.trim() ?? null;
  await syncWorkspaceSubscriptionFromStripeSubscription(db, sub, userId);

  const local = await db.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true, workspaceId: true, userId: true },
  });
  await recordWorkspaceBillingEvent(db, {
    stripeEvent: event,
    eventType: BillingEventType.invoice_paid,
    subscriptionId: local?.id ?? null,
    workspaceId: local?.workspaceId ?? null,
    userId: local?.userId ?? null,
  });

  return true;
}

export type SyncSubscriptionFromWebhookArgs = {
  event: Stripe.Event;
  prisma: PrismaClient;
  stripe: Stripe;
};

/**
 * LECIPM workspace subscription mirror only (invoice failed / paid, subscription lifecycle,
 * checkout.session.completed for workspace subscription). Returns true when this event
 * was handled as workspace billing (including workspace checkout sessions with missing sub id).
 *
 * Does not run mortgage expert handlers — use the main `/api/stripe/webhook` or call
 * mortgage handlers before this for `customer.subscription.*` and `checkout.session.completed`.
 */
export async function syncSubscriptionFromWebhook(
  args: SyncSubscriptionFromWebhookArgs
): Promise<boolean> {
  const { event, prisma: db, stripe } = args;

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    return handleWorkspaceInvoicePaymentFailed(stripe, invoice, event, db);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    return handleWorkspaceInvoicePaid(stripe, invoice, event, db);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    return handleWorkspaceSubscriptionStripeEvent(stripe, event, db);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription" && session.metadata?.paymentType === LECIPM_WORKSPACE_CHECKOUT) {
      const subRef = session.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef && typeof subRef === "object" ? subRef.id : null;
      const uid = session.metadata?.userId?.trim() ?? null;
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncWorkspaceSubscriptionFromStripeSubscription(db, sub, uid);
        } catch (e) {
          logError("Workspace subscription checkout sync failed", e);
        }
      }

      const ws = parseWorkspaceId(session.metadata);
      const billingType = mapStripeEventToBillingEventType(event.type);
      if (billingType) {
        await recordWorkspaceBillingEvent(db, {
          stripeEvent: event,
          eventType: billingType,
          subscriptionId: null,
          workspaceId: ws,
          userId: session.metadata?.userId?.trim() ?? null,
        });
      }
      if (uid) {
        const plan =
          typeof session.metadata?.planCode === "string" && session.metadata.planCode.trim()
            ? session.metadata.planCode.trim()
            : "pro";
        captureServerEvent(uid, AnalyticsEvents.SUBSCRIPTION_ACTIVATED, {
          plan,
          workspaceId: ws ?? undefined,
        });
      }
      return true;
    }
  }

  return false;
}
