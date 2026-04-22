/**
 * Cross-hub revenue rollups for admin + mobile — uses `platform_payments`, broker tables, and subscription mirrors.
 */

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hubBucketForPaymentType } from "@/modules/dashboard/services/revenue-dashboard.service";
import { LECIPM_STRIPE_METADATA, type LecipmSubscriptionHubKind } from "@/modules/pricing/pricing.config";

const PAID = "paid" as const;
const ACTIVE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];

function platformShareCents(row: { platformFeeCents: number | null; amountCents: number }): number {
  if (row.platformFeeCents != null && row.platformFeeCents > 0) return row.platformFeeCents;
  return row.amountCents;
}

export type LecipmRevenueByHub = {
  hubKey: string;
  hubLabel: string;
  platformCents: number;
  transactionCount: number;
};

export type LecipmMonetizationSummary = {
  period: { start: string; end: string };
  totalPlatformCents: number;
  dailyAverageCents: number;
  transactionCount: number;
  byHub: LecipmRevenueByHub[];
  /** Approximate MRR from workspace + broker SaaS rows (cents). */
  subscriptionMrrCentsApprox: number;
  activeWorkspaceSubscriptions: number;
  activeBrokerSaaS: number;
  brokerLeadRevenueCents: number;
  brokerLeadPaymentsCount: number;
};

/**
 * Executive summary for the last `days` days (default 30) of paid `PlatformPayment` + broker lead spend + active subs.
 */
export async function getLecipmMonetizationSummary(days = 30): Promise<LecipmMonetizationSummary> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  const [platformRows, brokerPayRows, workspaceSubs, brokerSubs] = await Promise.all([
    prisma.platformPayment.findMany({
      where: { status: PAID, createdAt: { gte: start, lte: end } },
      select: { paymentType: true, platformFeeCents: true, amountCents: true, createdAt: true },
    }),
    prisma.brokerPayment.findMany({
      where: { status: "success", createdAt: { gte: start, lte: end } },
      select: { amount: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { status: { in: ACTIVE } },
      select: { mrrCents: true, metadata: true, id: true },
    }),
    prisma.brokerLecipmSubscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      select: { id: true },
    }),
  ]);

  let totalPlatformCents = 0;
  const hubMap = new Map<string, { label: string; cents: number; n: number }>();

  for (const row of platformRows) {
    const share = platformShareCents(row);
    totalPlatformCents += share;
    const { hubKey, hubLabel } = hubBucketForPaymentType(row.paymentType);
    const prev = hubMap.get(hubKey) ?? { label: hubLabel, cents: 0, n: 0 };
    prev.cents += share;
    prev.n += 1;
    hubMap.set(hubKey, prev);
  }

  const brokerLeadRevenueCents = Math.round(
    brokerPayRows.reduce((s, r) => s + r.amount * 100, 0),
  );
  const brokerHub = hubMap.get("broker") ?? { label: "Broker Hub", cents: 0, n: 0 };
  brokerHub.cents += brokerLeadRevenueCents;
  brokerHub.n += brokerPayRows.length;
  hubMap.set("broker", brokerHub);

  totalPlatformCents += brokerLeadRevenueCents;

  const daySpan = Math.max(1, days);
  const dailyAverageCents = Math.round(totalPlatformCents / daySpan);

  let subscriptionMrrCentsApprox = 0;
  for (const s of workspaceSubs) {
    subscriptionMrrCentsApprox += s.mrrCents ?? 0;
  }

  const byHub: LecipmRevenueByHub[] = [...hubMap.entries()].map(([hubKey, v]) => ({
    hubKey,
    hubLabel: v.label,
    platformCents: v.cents,
    transactionCount: v.n,
  }));
  byHub.sort((a, b) => b.platformCents - a.platformCents);

  return {
    period: { start: start.toISOString(), end: end.toISOString() },
    totalPlatformCents,
    dailyAverageCents,
    transactionCount: platformRows.length + brokerPayRows.length,
    byHub,
    subscriptionMrrCentsApprox,
    activeWorkspaceSubscriptions: workspaceSubs.length,
    activeBrokerSaaS: brokerSubs.length,
    brokerLeadRevenueCents,
    brokerLeadPaymentsCount: brokerPayRows.length,
  };
}

/** Parse hub kind from mirrored subscription metadata (Stripe metadata echoed in webhook sync). */
export function hubKindFromSubscriptionMetadata(meta: unknown): LecipmSubscriptionHubKind | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>)[LECIPM_STRIPE_METADATA.hubKind];
  if (typeof raw !== "string") return null;
  const k = raw.trim().toLowerCase();
  const allowed: LecipmSubscriptionHubKind[] = [
    "workspace",
    "broker_saas",
    "investor",
    "residence_soins",
    "family_premium",
  ];
  return (allowed as string[]).includes(k) ? (k as LecipmSubscriptionHubKind) : null;
}
