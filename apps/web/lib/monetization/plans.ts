/**
 * Pricing plans – list, get, create, update subscription plans.
 */

import type { BillingCycle, SubscriptionPlanModule } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listPlans(params?: { module?: string; active?: boolean; marketId?: string }) {
  return prisma.subscriptionPlan.findMany({
    where: {
      ...(params?.module && { module: params.module as SubscriptionPlanModule }),
      ...(params?.active !== undefined && { active: params.active }),
      ...(params?.marketId !== undefined && { marketId: params.marketId }),
    },
    orderBy: [{ module: "asc" }, { amountCents: "asc" }],
  });
}

export async function getPlanBySlug(slug: string) {
  return prisma.subscriptionPlan.findUnique({
    where: { slug, active: true },
  });
}

export async function getPlanById(id: string) {
  return prisma.subscriptionPlan.findUnique({
    where: { id },
  });
}

export type CreatePlanInput = {
  name: string;
  slug: string;
  module: SubscriptionPlanModule;
  billingCycle: BillingCycle;
  amountCents: number;
  currency?: string;
  trialDays?: number;
  features?: Record<string, unknown> | null;
  active?: boolean;
  marketId?: string | null;
};

export async function createPlan(data: CreatePlanInput) {
  const features = data.features as Prisma.InputJsonValue | undefined;
  return prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      slug: data.slug,
      module: data.module,
      billingCycle: data.billingCycle,
      amountCents: data.amountCents,
      currency: data.currency ?? "USD",
      trialDays: data.trialDays ?? 0,
      features,
      active: data.active !== false,
      marketId: data.marketId ?? undefined,
    },
  });
}

export type UpdatePlanInput = Partial<Omit<CreatePlanInput, "slug">>;

export async function updatePlan(id: string, data: UpdatePlanInput) {
  const features = data.features as Prisma.InputJsonValue | undefined;
  return prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.module !== undefined && { module: data.module }),
      ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
      ...(data.amountCents !== undefined && { amountCents: data.amountCents }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.trialDays !== undefined && { trialDays: data.trialDays }),
      ...(data.features !== undefined && { features }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.marketId !== undefined && { marketId: data.marketId }),
    },
  });
}
