/**
 * Subscription and Billing Layer – plans, subscriptions, invoices, billing events.
 * Enforces plan-based feature access and trial handling.
 */
import { prisma } from "@/lib/db";
import type { SubscriptionStatus, BillingCycle, SubscriptionPlanModule } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { recordRevenueEntry } from "@/lib/revenue-intelligence";

export type { SubscriptionStatus, BillingCycle, SubscriptionPlanModule };

/** Get all active subscription plans (optionally by module). */
export async function getSubscriptionPlans(params?: { module?: SubscriptionPlanModule }) {
  const where: Prisma.SubscriptionPlanWhereInput = { active: true };
  if (params?.module) where.module = params.module;
  return prisma.subscriptionPlan.findMany({
    where,
    orderBy: [{ module: "asc" }, { amountCents: "asc" }],
  });
}

/** Get plan by slug. */
export async function getPlanBySlug(slug: string) {
  return prisma.subscriptionPlan.findUnique({
    where: { slug, active: true },
  });
}

/** Get current subscription for user (active or trialing). */
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
      currentPeriodEnd: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

/** Create a new subscription (e.g. after signup or upgrade). */
export async function createSubscription(params: {
  userId: string;
  planId: string;
  trialDays?: number;
}) {
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { id: params.planId },
  });
  const now = new Date();
  let currentPeriodEnd = new Date(now);
  if (plan.billingCycle === "MONTHLY") {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  }
  const trialEnd = params.trialDays
    ? new Date(now.getTime() + params.trialDays * 24 * 60 * 60 * 1000)
    : null;
  const status: SubscriptionStatus =
    params.trialDays && params.trialDays > 0 ? "TRIALING" : "ACTIVE";
  const periodEnd = trialEnd && trialEnd < currentPeriodEnd ? trialEnd : currentPeriodEnd;

  const sub = await prisma.subscription.create({
    data: {
      userId: params.userId,
      planId: params.planId,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    include: { plan: true },
  });

  await prisma.billingEvent.create({
    data: {
      subscriptionId: sub.id,
      userId: params.userId,
      eventType: "SUBSCRIPTION_CREATED",
      amountCents: plan.amountCents,
      metadata: { trialDays: params.trialDays, planSlug: plan.slug },
    },
  });
  return sub;
}

/** Record billing event (payment succeeded/failed, invoice paid, refund). */
export async function recordBillingEvent(params: {
  subscriptionId?: string;
  userId?: string;
  eventType: string;
  amountCents?: number;
  metadata?: object;
}) {
  return prisma.billingEvent.create({
    data: {
      subscriptionId: params.subscriptionId,
      userId: params.userId,
      eventType: params.eventType,
      amountCents: params.amountCents,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
}

/** Create invoice for subscription period. */
export async function createInvoice(params: {
  subscriptionId: string;
  amountCents: number;
  dueDate: Date;
  invoiceNumber?: string;
}) {
  return prisma.invoice.create({
    data: {
      subscriptionId: params.subscriptionId,
      amountCents: params.amountCents,
      dueDate: params.dueDate,
      status: "OPEN",
      invoiceNumber: params.invoiceNumber,
    },
  });
}

/** Get invoices for subscription. */
export async function getInvoicesForSubscription(subscriptionId: string, limit = 20) {
  return prisma.invoice.findMany({
    where: { subscriptionId },
    orderBy: { dueDate: "desc" },
    take: limit,
  });
}

/** Check if user has entitlement (e.g. feature from plan). */
export async function hasEntitlement(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; planSlug?: string }> {
  const sub = await getActiveSubscription(userId);
  if (!sub) return { allowed: false };
  const features = sub.plan.features as Record<string, unknown> | null;
  if (!features) return { allowed: true, planSlug: sub.plan.slug };
  const value = features[feature];
  if (value === true) return { allowed: true, planSlug: sub.plan.slug };
  if (typeof value === "number" && value > 0) return { allowed: true, planSlug: sub.plan.slug };
  return { allowed: false, planSlug: sub.plan.slug };
}

/** Record subscription revenue in revenue ledger (call when payment succeeds). */
export async function recordSubscriptionRevenue(params: {
  subscriptionId: string;
  invoiceId: string;
  amountCents: number;
  userId: string;
  marketId?: string;
}) {
  return recordRevenueEntry({
    type: "SUBSCRIPTION",
    entityType: "INVOICE",
    entityId: params.invoiceId,
    amountCents: params.amountCents,
    userId: params.userId,
    marketId: params.marketId,
    module: "PLATFORM",
    metadata: { subscriptionId: params.subscriptionId },
  });
}
