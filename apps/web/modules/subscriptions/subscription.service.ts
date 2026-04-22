import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hubKindFromSubscriptionMetadata } from "@/modules/revenue/lecipm-monetization-summary.service";
import type { LecipmSubscriptionHubKind } from "@/modules/pricing/pricing.config";

import type {
  SubscriptionActivationStatus,
  SubscriptionVertical,
  UserSubscriptionBundle,
  UserSubscriptionRecord,
} from "./subscription.types";

const ACTIVE_STRIPE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];
const ACTIVE_BROKER = new Set(["active", "trialing"]);

function mapStripeStatus(s: SubscriptionStatus): SubscriptionActivationStatus {
  switch (s) {
    case SubscriptionStatus.trialing:
      return "trialing";
    case SubscriptionStatus.active:
      return "active";
    case SubscriptionStatus.past_due:
      return "past_due";
    case SubscriptionStatus.canceled:
      return "canceled";
    default:
      return "unknown";
  }

}

function verticalFromHubKind(kind: LecipmSubscriptionHubKind | null): SubscriptionVertical | null {
  if (!kind || kind === "workspace" || kind === "broker_saas") return null;
  if (kind === "investor") return "INVESTOR";
  if (kind === "residence_soins") return "RESIDENCE";
  if (kind === "family_premium") return "FAMILY";
  return null;
}

function workspaceRowToRecord(metaKind: LecipmSubscriptionHubKind | null, row: {
  planCode: string;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  mrrCents: number | null;
}): UserSubscriptionRecord | null {
  const v = verticalFromHubKind(metaKind);
  if (!v) return null;
  return {
    vertical: v,
    status: mapStripeStatus(row.status),
    planLabel: row.planCode,
    stripeSubscriptionId: row.stripeSubscriptionId,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    mrrCents: row.mrrCents,
  };
}

/** All recognized subscription rows for dashboards and guards. */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionBundle> {
  const subs: UserSubscriptionRecord[] = [];

  const [workspaceRows, brokerRow] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId, status: { in: ACTIVE_STRIPE } },
      select: {
        planCode: true,
        status: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        mrrCents: true,
        metadata: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.brokerLecipmSubscription.findUnique({
      where: { userId },
      select: {
        planSlug: true,
        status: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    }),
  ]);

  for (const row of workspaceRows) {
    const kind = hubKindFromSubscriptionMetadata(row.metadata);
    const rec = workspaceRowToRecord(kind, {
      planCode: row.planCode,
      status: row.status,
      stripeSubscriptionId: row.stripeSubscriptionId,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      mrrCents: row.mrrCents,
    });
    if (rec) subs.push(rec);
  }

  if (brokerRow && ACTIVE_BROKER.has(brokerRow.status)) {
    subs.push({
      vertical: "BROKER",
      status: brokerRow.status === "trialing" ? "trialing" : "active",
      planLabel: brokerRow.planSlug,
      stripeSubscriptionId: brokerRow.stripeSubscriptionId ?? null,
      currentPeriodEnd: brokerRow.currentPeriodEnd,
      cancelAtPeriodEnd: brokerRow.cancelAtPeriodEnd,
      mrrCents: null,
    });
  }

  return { userId, subscriptions: subs };
}

export async function hasActiveSubscription(
  userId: string,
  type: SubscriptionVertical,
): Promise<boolean> {
  const bundle = await getUserSubscription(userId);
  return bundle.subscriptions.some(
    (s) => s.vertical === type && (s.status === "active" || s.status === "trialing"),
  );
}
