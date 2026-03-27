import type { LecipmConversionSubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findSubscriptionByUserId(userId: string) {
  return prisma.lecipmConversionSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
}

export async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
  return prisma.lecipmConversionSubscription.findUnique({
    where: { providerSubscriptionId: stripeSubscriptionId },
    include: { plan: true, user: true },
  });
}

export async function upsertSubscription(args: {
  userId: string;
  planId: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  status: LecipmConversionSubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  return prisma.lecipmConversionSubscription.upsert({
    where: { userId: args.userId },
    create: {
      userId: args.userId,
      planId: args.planId,
      providerCustomerId: args.providerCustomerId ?? undefined,
      providerSubscriptionId: args.providerSubscriptionId ?? undefined,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart ?? undefined,
      currentPeriodEnd: args.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
    },
    update: {
      planId: args.planId,
      providerCustomerId: args.providerCustomerId ?? undefined,
      providerSubscriptionId: args.providerSubscriptionId ?? undefined,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart ?? undefined,
      currentPeriodEnd: args.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
    },
  });
}
