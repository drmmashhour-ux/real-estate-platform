/**
 * Observational admin snapshot — no rankings, no payouts; coaching visibility only.
 */

import { prisma } from "@/lib/db";
import { computeBrokerStreaks } from "./broker-streak.service";
import { computeBrokerMilestonesFromMetricsOnly } from "./broker-milestone.service";
import { aggregateBrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.service";
import { scoreBrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance-scoring.service";

const MS_DAY = 86400000;

export type BrokerIncentiveAdminRow = {
  brokerId: string;
  displayName: string;
  activityStreakCurrent: number;
  inactiveDaysApprox: number;
  milestonesAchieved: number;
  recentWin: boolean;
};

export type BrokerIncentivesAdminOverview = {
  strongActivityStreaks: BrokerIncentiveAdminRow[];
  inactiveBrokers: BrokerIncentiveAdminRow[];
  recentWinBrokers: { brokerId: string; displayName: string }[];
  scanned: number;
  note: string;
};

function touchMs(l: {
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastContactedAt: Date | null;
  lastFollowUpAt: Date | null;
}): number {
  return Math.max(
    0,
    ...[l.firstContactAt, l.lastContactAt, l.lastContactedAt, l.lastFollowUpAt]
      .filter(Boolean)
      .map((d) => d!.getTime()),
  );
}

export async function buildBrokerIncentivesAdminOverview(options?: {
  maxBrokers?: number;
  nowMs?: number;
}): Promise<BrokerIncentivesAdminOverview> {
  const max = Math.min(options?.maxBrokers ?? 36, 80);
  const nowMs = options?.nowMs ?? Date.now();

  const brokers = await prisma.user.findMany({
    where: { role: "BROKER", accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    take: max,
    orderBy: { createdAt: "desc" },
  });

  const strong: BrokerIncentiveAdminRow[] = [];
  const inactive: BrokerIncentiveAdminRow[] = [];
  const recentWinners: { brokerId: string; displayName: string }[] = [];

  const fourteenDaysAgo = new Date(nowMs - 14 * MS_DAY);

  for (const b of brokers) {
    const displayName = (b.name?.trim() || b.email?.trim() || "Broker").slice(0, 120);

    const leads = await prisma.lead.findMany({
      where: {
        OR: [{ introducedByBrokerId: b.id }, { lastFollowUpByBrokerId: b.id }],
      },
      select: {
        firstContactAt: true,
        lastContactAt: true,
        lastContactedAt: true,
        lastFollowUpAt: true,
        contactUnlockedAt: true,
        wonAt: true,
      },
      take: 500,
    });

    const streaks = computeBrokerStreaks(leads, nowMs);
    const activity = streaks.find((s) => s.type === "activity")?.currentCount ?? 0;

    const lastTouch = leads.reduce((mx, l) => Math.max(mx, touchMs(l)), 0);
    const inactiveDays =
      lastTouch > 0 ? Math.max(0, Math.floor((nowMs - lastTouch) / MS_DAY)) : 999;

    const raw = await aggregateBrokerPerformanceMetrics(b.id);
    const metrics = raw ? scoreBrokerPerformanceMetrics(raw) : null;
    const milestones = metrics ? computeBrokerMilestonesFromMetricsOnly(metrics) : [];
    const achieved = milestones.filter((m) => m.achieved).length;

    const recentWin = leads.some((l) => l.wonAt != null && l.wonAt >= fourteenDaysAgo);

    if (recentWin) recentWinners.push({ brokerId: b.id, displayName });

    const row: BrokerIncentiveAdminRow = {
      brokerId: b.id,
      displayName,
      activityStreakCurrent: activity,
      inactiveDaysApprox: inactiveDays,
      milestonesAchieved: achieved,
      recentWin,
    };

    if (activity >= 4) strong.push(row);
    if (inactiveDays >= 7 && leads.length > 0) inactive.push(row);
  }

  strong.sort((a, b) => b.activityStreakCurrent - a.activityStreakCurrent);
  inactive.sort((a, b) => b.inactiveDaysApprox - a.inactiveDaysApprox);

  return {
    strongActivityStreaks: strong.slice(0, 12),
    inactiveBrokers: inactive.slice(0, 12),
    recentWinBrokers: recentWinners.slice(0, 15),
    scanned: brokers.length,
    note: "Observational only — not performance management or payouts.",
  };
}
