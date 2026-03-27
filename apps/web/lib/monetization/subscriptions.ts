/**
 * Subscriptions – create, get, cancel. Uses existing Subscription and Invoice models.
 */

import { prisma } from "@/lib/db";

export async function createSubscription(
  userId: string,
  planId: string,
  options?: { startAt?: Date }
) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) throw new Error("Plan not found or inactive");

  const start = options?.startAt ?? new Date();
  const isYearly = plan.billingCycle === "YEARLY";
  const end = new Date(start);
  if (isYearly) end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const status = plan.trialDays > 0 ? "TRIALING" : "ACTIVE";
  return prisma.planSubscription.create({
    data: {
      userId,
      planId,
      status,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    },
    include: { plan: true },
  });
}

export async function getSubscription(id: string) {
  return prisma.planSubscription.findUnique({
    where: { id },
    include: { plan: true, invoices: { orderBy: { dueDate: "desc" }, take: 12 } },
  });
}

export async function getActiveSubscriptionForUser(userId: string) {
  return prisma.planSubscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
      currentPeriodEnd: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  return prisma.planSubscription.update({
    where: { id: subscriptionId },
    data: { cancelAtPeriodEnd: true },
    include: { plan: true },
  });
}

export async function getInvoicesForUser(userId: string, limit = 24) {
  const subs = await prisma.planSubscription.findMany({
    where: { userId },
    select: { id: true },
  });
  const subIds = subs.map((s) => s.id);
  return prisma.invoice.findMany({
    where: { subscriptionId: { in: subIds } },
    orderBy: { dueDate: "desc" },
    take: limit,
    include: { subscription: { include: { plan: true } } },
  });
}
