import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import {
  cumulativePointsToLevel,
  effectivePointsMultiplier,
  featuredPlacementEligible,
  complianceQualityScore,
} from "@/modules/gamification/broker-gamification-policy";
import { sumPointsTotal } from "@/modules/gamification/broker-points.service";

/** Grant monthly leaderboard rewards — top brokers by normalized score (policy-filtered upstream). */
export async function grantMonthlyTopRewards(monthStart: Date, topN = 10): Promise<number> {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const agg = await prisma.brokerPointsLedger.groupBy({
    by: ["brokerId"],
    where: { createdAt: { gte: monthStart, lt: monthEnd }, points: { gt: 0 } },
    _sum: { points: true },
  });

  const scored: { brokerId: string; score: number }[] = [];
  for (const row of agg) {
    const user = await prisma.user.findUnique({
      where: { id: row.brokerId },
      select: {
        role: true,
        brokerStatus: true,
        brokerVerifications: { take: 1, select: { verificationStatus: true } },
      },
    });
    if (!user || user.role !== PlatformRole.BROKER) continue;

    const cq = complianceQualityScore({
      brokerStatus: user.brokerStatus,
      verificationStatus: user.brokerVerifications[0]?.verificationStatus ?? null,
    });
    if (cq < 0.35) continue;

    const raw = row._sum.points ?? 0;
    const eff = raw * effectivePointsMultiplier(cq, 0);
    scored.push({ brokerId: row.brokerId, score: eff });
  }

  scored.sort((a, b) => b.score - a.score);
  const winners = scored.slice(0, topN);

  const monthKey = monthStart.toISOString().slice(0, 7);
  let granted = 0;
  for (const w of winners) {
    const dup = await prisma.brokerReward.findFirst({
      where: {
        brokerId: w.brokerId,
        rewardType: "FEATURED_PROFILE",
        metadataJson: { path: ["month"], equals: monthKey },
      },
    });
    if (dup) continue;

    await prisma.brokerReward.createMany({
      data: [
        {
          brokerId: w.brokerId,
          rewardType: "FEATURED_PROFILE",
          status: "AVAILABLE",
          metadataJson: { source: "monthly_top", month: monthKey },
        },
        {
          brokerId: w.brokerId,
          rewardType: "CREDITS",
          status: "AVAILABLE",
          metadataJson: { bundle: "premium_credit_small", source: "monthly_top", month: monthKey },
        },
      ],
    });
    granted += 2;
  }
  return granted;
}

export async function listRewards(brokerId: string) {
  return prisma.brokerReward.findMany({
    where: { brokerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function redeemReward(rewardId: string, brokerId: string): Promise<boolean> {
  const r = await prisma.brokerReward.findFirst({
    where: { id: rewardId, brokerId, status: "AVAILABLE" },
  });
  if (!r) return false;

  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { brokerStatus: true, brokerVerifications: { take: 1, select: { verificationStatus: true } } },
  });
  const cq = complianceQualityScore({
    brokerStatus: user?.brokerStatus ?? "NONE",
    verificationStatus: user?.brokerVerifications[0]?.verificationStatus ?? null,
  });
  const total = await sumPointsTotal(brokerId);
  const level = cumulativePointsToLevel(total, cq);

  if (r.rewardType === "FEATURED_PROFILE" && !featuredPlacementEligible(level, cq)) {
    return false;
  }

  await prisma.brokerReward.update({
    where: { id: rewardId },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });
  return true;
}
