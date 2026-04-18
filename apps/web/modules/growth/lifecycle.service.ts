/**
 * Broker lifecycle / churn-risk signals — advisory; triggers are suggestions for operators (no auto-send here).
 */

import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const LEAD_TYPES = ["lead_unlock", "lead_purchased"] as const;

export type BrokerLifecycleStage = "new" | "active" | "cooling" | "at_risk";

export type BrokerLifecycleRow = {
  userId: string;
  email: string | null;
  stage: BrokerLifecycleStage;
  daysSinceLastPurchase: number | null;
  lifetimePurchases: number;
  churnRisk: "low" | "medium" | "high";
  engagementNote: string;
  suggestedPlaybook: string;
};

export async function getBrokerLifecycleSnapshots(limit = 30): Promise<BrokerLifecycleRow[]> {
  const events = await prisma.revenueEvent.findMany({
    where: {
      eventType: { in: [...LEAD_TYPES] },
      amount: { gt: 0 },
      userId: { not: null },
    },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 30_000,
  });

  const lastByUser = new Map<string, Date>();
  const countByUser = new Map<string, number>();
  for (const e of events) {
    if (!e.userId) continue;
    countByUser.set(e.userId, (countByUser.get(e.userId) ?? 0) + 1);
    if (!lastByUser.has(e.userId)) lastByUser.set(e.userId, e.createdAt);
  }

  const userIds = [...lastByUser.keys()].slice(0, 150);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      role: PlatformRole.BROKER,
      accountStatus: AccountStatus.ACTIVE,
    },
    select: { id: true, email: true, createdAt: true },
  });

  const now = Date.now();
  const rows: BrokerLifecycleRow[] = [];

  for (const u of users) {
    const last = lastByUser.get(u.id);
    const n = countByUser.get(u.id) ?? 0;
    const daysSince = last ? Math.floor((now - last.getTime()) / 86_400_000) : null;

    let stage: BrokerLifecycleStage = "active";
    if (n <= 1 && (daysSince == null || daysSince < 21)) stage = "new";
    else if (daysSince != null && daysSince > 21) stage = "cooling";
    if (daysSince != null && daysSince > 45 && n >= 2) stage = "at_risk";

    let churnRisk: BrokerLifecycleRow["churnRisk"] = "low";
    if (daysSince != null && daysSince > 30 && n >= 1) churnRisk = "medium";
    if (daysSince != null && daysSince > 60 && n >= 2) churnRisk = "high";

    rows.push({
      userId: u.id,
      email: u.email,
      stage,
      daysSinceLastPurchase: daysSince,
      lifetimePurchases: n,
      churnRisk,
      engagementNote:
        daysSince == null
          ? "No monetization events recorded."
          : `Last paid unlock ${daysSince}d ago.`,
      suggestedPlaybook:
        churnRisk === "high"
          ? "Reactivation: personal outreach + offer masked lead preview + win-back note."
          : stage === "new"
            ? "Onboard: confirm first unlock success and next-step cadence."
            : "Maintain: monthly check-in and pipeline visibility.",
    });
  }

  rows.sort((a, b) => {
    const rank = (c: BrokerLifecycleRow) => (c.churnRisk === "high" ? 0 : c.churnRisk === "medium" ? 1 : 2);
    return rank(a) - rank(b) || (b.lifetimePurchases - a.lifetimePurchases);
  });

  return rows.slice(0, limit);
}
