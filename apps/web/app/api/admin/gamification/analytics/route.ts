import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Participation + redemption aggregates for admin dashboards. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (admin?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const [
    ledgerBrokers,
    badgeRows,
    rewardGranted,
    rewardRedeemed,
    eventsLast30,
    badgeRollup,
  ] = await Promise.all([
    prisma.brokerPointsLedger.groupBy({
      by: ["brokerId"],
      where: { createdAt: { gte: thirty } },
      _count: { brokerId: true },
    }).then((r) => r.length),
    prisma.brokerBadge.groupBy({
      by: ["badgeCode"],
      _count: { badgeCode: true },
    }),
    prisma.brokerReward.count({
      where: { createdAt: { gte: thirty } },
    }),
    prisma.brokerReward.count({
      where: { status: "REDEEMED", redeemedAt: { gte: thirty } },
    }),
    prisma.brokerGamificationEvent.count({
      where: { createdAt: { gte: thirty } },
    }),
    prisma.brokerBadge.groupBy({
      by: ["badgeCode"],
      where: { earnedAt: { gte: thirty } },
      _count: { badgeCode: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    participation: {
      distinctBrokersWithPointsLast30d: ledgerBrokers,
      gamificationEventsLast30d: eventsLast30,
    },
    badges: {
      totalByCode: badgeRows.map((b) => ({ code: b.badgeCode, count: b._count.badgeCode })),
      earnedLast30dByCode: badgeRollup.map((b) => ({ code: b.badgeCode, count: b._count.badgeCode })),
    },
    rewards: {
      createdLast30d: rewardGranted,
      redeemedLast30d: rewardRedeemed,
    },
  });
}
