import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import {
  complianceQualityScore,
  cumulativePointsToLevel,
  effectivePointsMultiplier,
  leaderboardEligible,
} from "@/modules/gamification/broker-gamification-policy";
import type { LeaderboardRow, LeaderboardScope, LeaderboardWindow } from "@/modules/gamification/broker-gamification.types";

function windowStart(window: LeaderboardWindow): Date | null {
  const now = new Date();
  if (window === "ALL_TIME") return null;
  if (window === "WEEKLY") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() - 1);
  return d;
}

async function brokerQualitySignals(brokerId: string): Promise<{
  cq: number;
  ignoredApprox: number;
  city: string | null;
  agency: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: {
      homeCity: true,
      brokerStatus: true,
      brokerVerifications: { take: 1, select: { brokerageCompany: true, verificationStatus: true } },
    },
  });

  const cq = complianceQualityScore({
    brokerStatus: user?.brokerStatus ?? "NONE",
    verificationStatus: user?.brokerVerifications[0]?.verificationStatus ?? null,
  });

  let staleLeads = 0;
  try {
    staleLeads = await prisma.lecipmBrokerCrmLead.count({
      where: {
        brokerUserId: brokerId,
        status: "new",
        createdAt: { lt: new Date(Date.now() - 72 * 3600000) },
        lastContactAt: null,
      },
    });
  } catch {
    staleLeads = 0;
  }

  return {
    cq,
    ignoredApprox: Math.min(20, staleLeads),
    city: user?.homeCity?.trim() ?? null,
    agency: user?.brokerVerifications[0]?.brokerageCompany?.trim() ?? null,
  };
}

export async function buildLeaderboard(options: {
  scope: LeaderboardScope;
  window: LeaderboardWindow;
  city?: string | null;
  agency?: string | null;
  take?: number;
}): Promise<LeaderboardRow[]> {
  const since = windowStart(options.window);
  const take = Math.min(options.take ?? 50, 100);

  const agg = await prisma.brokerPointsLedger.groupBy({
    by: ["brokerId"],
    where: {
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { points: true },
  });

  const rows: LeaderboardRow[] = [];

  for (const row of agg) {
    const raw = row._sum.points ?? 0;
    if (raw <= 0) continue;

    const user = await prisma.user.findUnique({
      where: { id: row.brokerId },
      select: {
        role: true,
        name: true,
        email: true,
        homeCity: true,
        brokerStatus: true,
        brokerVerifications: { take: 1, select: { brokerageCompany: true, verificationStatus: true } },
      },
    });
    if (!user || user.role !== PlatformRole.BROKER) continue;

    const sig = await brokerQualitySignals(row.brokerId);
    if (options.scope === "CITY" && options.city) {
      const want = options.city.trim().toLowerCase();
      const has = sig.city?.toLowerCase();
      if (!has || has !== want) continue;
    }
    if (options.scope === "AGENCY" && options.agency) {
      const want = options.agency.trim().toLowerCase();
      const has = sig.agency?.toLowerCase();
      if (!has || has !== want) continue;
    }

    const norm =
      raw *
      effectivePointsMultiplier(sig.cq, sig.ignoredApprox) *
      (1 + Math.min(0.25, raw / 5000)); // dampen pure volume slightly

    const totalEver = await prisma.brokerPointsLedger.aggregate({
      where: { brokerId: row.brokerId },
      _sum: { points: true },
    });
    const totalRaw = totalEver._sum.points ?? raw;
    const level = cumulativePointsToLevel(totalRaw * effectivePointsMultiplier(sig.cq, sig.ignoredApprox), sig.cq);

    const badgeCount = await prisma.brokerBadge.count({ where: { brokerId: row.brokerId } });

    if (!leaderboardEligible(sig.cq, norm)) continue;

    rows.push({
      rank: 0,
      brokerId: row.brokerId,
      displayName: user.name ?? user.email ?? row.brokerId.slice(0, 8),
      city: sig.city,
      agencyKey: sig.agency,
      rawPoints: raw,
      normalizedScore: Math.round(norm * 10) / 10,
      level,
      badgeCount,
    });
  }

  rows.sort((a, b) => b.normalizedScore - a.normalizedScore);
  for (let i = 0; i < rows.length; i++) rows[i]!.rank = i + 1;

  return rows.slice(0, take);
}

export async function rankOfBroker(brokerId: string, window: LeaderboardWindow): Promise<number | null> {
  const board = await buildLeaderboard({ scope: "GLOBAL", window, take: 500 });
  const row = board.find((r) => r.brokerId === brokerId);
  return row?.rank ?? null;
}
