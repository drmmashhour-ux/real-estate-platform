import type { TrustgraphSubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import type { SubscriptionStatusDto } from "@/lib/trustgraph/domain/billing";
import { isTrustGraphBillingEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

function emitBillingEvent(workspaceId: string | null, eventType: string, payload: object) {
  void prisma.trustgraphBillingEvent
    .create({
      data: {
        workspaceId: workspaceId ?? undefined,
        eventType,
        payload: payload as object,
      },
    })
    .catch(() => {});
  void recordPlatformEvent({
    eventType: "trustgraph_billing_event",
    sourceModule: "trustgraph",
    entityType: "BILLING",
    entityId: eventType,
    payload: { workspaceId, ...payload },
  }).catch(() => {});
}

export async function createSubscriptionRecord(args: {
  workspaceId: string;
  planId: string;
  status?: TrustgraphSubscriptionStatus;
}): Promise<{ subscriptionId: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return { skipped: true };

  const cfg = getPhase8PlatformConfig();
  const end = new Date();
  end.setDate(end.getDate() + cfg.billing.defaultTrialDays);

  const row = await prisma.trustgraphSubscription.create({
    data: {
      workspaceId: args.workspaceId,
      planId: args.planId,
      status: args.status ?? "trial",
      currentPeriodStart: new Date(),
      currentPeriodEnd: end,
    },
    select: { id: true },
  });

  emitBillingEvent(args.workspaceId, "subscription_created", { subscriptionId: row.id, planId: args.planId });
  return { subscriptionId: row.id };
}

export async function updateSubscriptionRecord(args: {
  subscriptionId: string;
  status: TrustgraphSubscriptionStatus;
  workspaceId: string;
}): Promise<{ ok: true } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return { skipped: true };

  await prisma.trustgraphSubscription.update({
    where: { id: args.subscriptionId },
    data: { status: args.status },
  });
  emitBillingEvent(args.workspaceId, "subscription_updated", { subscriptionId: args.subscriptionId, status: args.status });
  return { ok: true };
}

export async function cancelSubscriptionRecord(args: {
  subscriptionId: string;
  workspaceId: string;
}): Promise<{ ok: true } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return { skipped: true };

  await prisma.trustgraphSubscription.update({
    where: { id: args.subscriptionId },
    data: { status: "canceled" },
  });
  emitBillingEvent(args.workspaceId, "subscription_canceled", { subscriptionId: args.subscriptionId });
  return { ok: true };
}

export async function getSubscriptionStatusDto(workspaceId: string): Promise<SubscriptionStatusDto | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return null;

  const sub = await prisma.trustgraphSubscription.findFirst({
    where: { workspaceId },
    include: { plan: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!sub) {
    return {
      subscriptionId: null,
      planId: null,
      planName: null,
      status: "none",
      currentPeriodEnd: null,
    };
  }
  return {
    subscriptionId: sub.id,
    planId: sub.planId,
    planName: sub.plan.name,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  };
}

export async function ensureDefaultPlanIfMissing(): Promise<string | null> {
  const existing = await prisma.trustgraphSubscriptionPlan.findFirst({ where: { name: "Enterprise Default" } });
  if (existing) return existing.id;

  const created = await prisma.trustgraphSubscriptionPlan.create({
    data: {
      name: "Enterprise Default",
      features: {
        premiumPlacement: true,
        advancedAnalytics: true,
        slaFeatures: true,
        enterpriseDashboards: true,
      } as object,
      pricing: { currency: "CAD", note: "configure via billing provider adapter" } as object,
      limits: { apiCallsPerMonth: 100000 } as object,
    },
    select: { id: true },
  });
  return created.id;
}
