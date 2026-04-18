/**
 * Advisory broker tiers (Basic / Pro / Elite) from plan + rolling spend — additive; does not change billing.
 */

import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BrokerTierLabel = "basic" | "pro" | "elite";

const LEAD_TYPES = ["lead_unlock", "lead_purchased"] as const;

export type BrokerTierProfile = {
  userId: string;
  email: string | null;
  plan: string;
  brokerTier: BrokerTierLabel;
  monthlySpendCad: number;
  benefits: string[];
};

function tierFromPlanAndSpend(plan: string, monthlySpendCad: number): BrokerTierLabel {
  const p = (plan || "free").toLowerCase();
  if (monthlySpendCad >= 900 && (p === "pro" || p === "premium")) return "elite";
  if (p === "pro" || p === "premium" || monthlySpendCad >= 250) return "pro";
  return "basic";
}

function benefitsForTier(tier: BrokerTierLabel): string[] {
  if (tier === "elite") {
    return [
      "Fastest access to new high-intent leads (routing priority in product rules).",
      "Priority lead pool visibility where enabled.",
      "Volume pricing review eligibility (operator-approved).",
    ];
  }
  if (tier === "pro") {
    return ["Earlier access vs Basic", "Priority hints in broker workspace", "Weekly unlock allowance where plan applies"];
  }
  return ["Standard queue", "Pay-per-unlock as configured", "Upgrade path to Pro for more coverage"];
}

export async function getBrokerTierProfile(userId: string): Promise<BrokerTierProfile | null> {
  const u = await prisma.user.findFirst({
    where: { id: userId, role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
    select: { id: true, email: true, plan: true },
  });
  if (!u) return null;

  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));

  const rows = await prisma.revenueEvent.findMany({
    where: {
      userId,
      createdAt: { gte: monthStart, lt: nextMonth },
      eventType: { in: [...LEAD_TYPES] },
      amount: { gt: 0 },
    },
    select: { amount: true },
  });
  const monthlySpendCad = Math.round(rows.reduce((s, r) => s + Number(r.amount), 0) * 100) / 100;

  const brokerTier = tierFromPlanAndSpend(u.plan, monthlySpendCad);
  return {
    userId: u.id,
    email: u.email,
    plan: u.plan,
    brokerTier,
    monthlySpendCad,
    benefits: benefitsForTier(brokerTier),
  };
}

/** Summaries for top spenders — command center (batched). */
export async function listBrokerTierSummaries(limit = 25): Promise<BrokerTierProfile[]> {
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));

  const events = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: monthStart, lt: nextMonth },
      eventType: { in: [...LEAD_TYPES] },
      amount: { gt: 0 },
      userId: { not: null },
    },
    select: { userId: true, amount: true },
    take: 20_000,
  });

  const spend = new Map<string, number>();
  for (const e of events) {
    if (!e.userId) continue;
    const a = Number(e.amount);
    if (!Number.isFinite(a)) continue;
    spend.set(e.userId, (spend.get(e.userId) ?? 0) + a);
  }

  const userIds = [...spend.keys()];
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      role: PlatformRole.BROKER,
      accountStatus: AccountStatus.ACTIVE,
    },
    select: { id: true, email: true, plan: true },
  });

  const out: BrokerTierProfile[] = users.map((u) => {
    const monthlySpendCad = Math.round((spend.get(u.id) ?? 0) * 100) / 100;
    const brokerTier = tierFromPlanAndSpend(u.plan, monthlySpendCad);
    return {
      userId: u.id,
      email: u.email,
      plan: u.plan,
      brokerTier,
      monthlySpendCad,
      benefits: benefitsForTier(brokerTier),
    };
  });

  out.sort((a, b) => b.monthlySpendCad - a.monthlySpendCad);
  return out.slice(0, limit);
}
