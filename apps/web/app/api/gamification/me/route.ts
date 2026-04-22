import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import {
  cumulativePointsToLevel,
  complianceQualityScore,
  effectivePointsMultiplier,
} from "@/modules/gamification/broker-gamification-policy";
import { sumPointsTotal } from "@/modules/gamification/broker-points.service";
import { listBadges, lockedBadgeHints } from "@/modules/gamification/broker-badges.service";
import { getStreaks } from "@/modules/gamification/broker-streaks.service";
import { listRewards } from "@/modules/gamification/broker-rewards.service";
import { buildLeaderboard, rankOfBroker } from "@/modules/gamification/broker-leaderboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      brokerStatus: true,
      brokerVerifications: { take: 1, select: { verificationStatus: true } },
    },
  });

  if (!me || me.role !== PlatformRole.BROKER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const cq = complianceQualityScore({
    brokerStatus: me.brokerStatus,
    verificationStatus: me.brokerVerifications[0]?.verificationStatus ?? null,
  });

  let staleLeads = 0;
  try {
    staleLeads = await prisma.lecipmBrokerCrmLead.count({
      where: {
        brokerUserId: userId,
        status: "new",
        createdAt: { lt: new Date(Date.now() - 72 * 3600000) },
        lastContactAt: null,
      },
    });
  } catch {
    staleLeads = 0;
  }
  const ignoredApprox = Math.min(20, staleLeads);

  const rawTotal = await sumPointsTotal(userId);
  const effMultiplier = effectivePointsMultiplier(cq, ignoredApprox);
  const effectivePoints = Math.round(rawTotal * effMultiplier);
  const level = cumulativePointsToLevel(rawTotal, cq);

  const badges = await listBadges(userId);
  const codesEarned = new Set(badges.map((b) => b.badgeCode));

  const rewards = await listRewards(userId);
  const preview = await buildLeaderboard({
    scope: "GLOBAL",
    window: "MONTHLY",
    take: 8,
  });

  const myRankGlobal = await rankOfBroker(userId, "MONTHLY");

  return NextResponse.json({
    ok: true,
    brokerId: userId,
    totalPoints: rawTotal,
    effectivePoints,
    complianceQuality: cq,
    level,
    streaks: await getStreaks(userId),
    badgesEarned: badges.length,
    badges: badges.slice(0, 24),
    badgesLockedHints: lockedBadgeHints(codesEarned),
    rewardsAvailable: rewards.filter((r) => r.status === "AVAILABLE").length,
    rewards,
    leaderboardPreview: preview,
    myRankGlobal,
  });
}
