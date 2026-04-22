/**
 * Unified subscription snapshot per user — workspace Stripe mirror + broker SaaS + optional hub kind on metadata.
 */

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hubKindFromSubscriptionMetadata } from "@/modules/revenue/lecipm-monetization-summary.service";
import type { LecipmSubscriptionHubKind } from "@/modules/pricing/pricing.config";

const ACTIVE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];

export type WorkspaceSubscriptionVm = {
  planCode: string;
  status: SubscriptionStatus;
  mrrCents: number | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hubKind: LecipmSubscriptionHubKind | null;
};

export type BrokerSaaSVm = {
  planSlug: string;
  status: string;
  currentPeriodEnd: Date | null;
};

export type LecipmUserSubscriptionSnapshot = {
  userId: string;
  workspace: WorkspaceSubscriptionVm | null;
  brokerSaaS: BrokerSaaSVm | null;
};

export async function getLecipmUserSubscriptionSnapshot(userId: string): Promise<LecipmUserSubscriptionSnapshot> {
  const [ws, broker] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: { in: ACTIVE } },
      orderBy: { updatedAt: "desc" },
      select: {
        planCode: true,
        status: true,
        mrrCents: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        metadata: true,
      },
    }),
    prisma.brokerLecipmSubscription.findUnique({
      where: { userId },
      select: { planSlug: true, status: true, currentPeriodEnd: true },
    }),
  ]);

  const workspace: WorkspaceSubscriptionVm | null = ws
    ? {
        planCode: ws.planCode,
        status: ws.status,
        mrrCents: ws.mrrCents,
        currentPeriodEnd: ws.currentPeriodEnd,
        cancelAtPeriodEnd: ws.cancelAtPeriodEnd,
        hubKind: hubKindFromSubscriptionMetadata(ws.metadata),
      }
    : null;

  const brokerSaaS: BrokerSaaSVm | null =
    broker && ["active", "trialing"].includes(broker.status)
      ? {
          planSlug: broker.planSlug,
          status: broker.status,
          currentPeriodEnd: broker.currentPeriodEnd,
        }
      : null;

  return { userId, workspace, brokerSaaS };
}
