/**
 * DB-backed leadership metrics for the primary market. Falls back to zeros when the City row is missing.
 */

import { AccountStatus, PlatformRole, type Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { PRIMARY_MARKET } from "./primary-market.config";
import type { LeadershipMetrics } from "./leadership-metrics.types";

const MS_90D = 90 * 24 * 60 * 60 * 1000;
const MS_30D = 30 * 24 * 60 * 60 * 1000;
/** Heuristic: ~25 meaningful events / broker / month = engaged cohort */
const EVENTS_PER_BROKER_TARGET_MONTH = 25;

const CLOSED_STATUSES = ["closed"] as const;

function since(ms: number): Date {
  return new Date(Date.now() - ms);
}

async function resolveMontrealCityId(db: PrismaClient): Promise<string | null> {
  const c = await db.city.findFirst({
    where: {
      OR: [
        { slug: PRIMARY_MARKET.primaryCitySlug },
        { slug: "mtl" },
        { name: { contains: "Montr", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return c?.id ?? null;
}

/**
 * @param mode - `montreal` = lecipmCity scoping; `quebec` = broader QC (deal jurisdiction + any QC-tagged context)
 */
export async function fetchLeadershipMetrics(
  db: PrismaClient,
  mode: "montreal" | "quebec" = "montreal"
): Promise<LeadershipMetrics> {
  const asOfIso = new Date().toISOString();
  const cityId = await resolveMontrealCityId(db);
  if (!cityId && mode === "montreal") {
    return {
      activeBrokers: 0,
      dealsProcessed: 0,
      engagementRate: 0,
      revenueCents: 0,
      asOfIso,
      scope: "montreal (city not in DB — seed lecipm_cities)",
    };
  }

  if (mode === "quebec") {
    return fetchQuebecRollup(db, asOfIso);
  }

  const brokerWhere: Prisma.UserWhereInput = {
    role: PlatformRole.BROKER,
    accountStatus: AccountStatus.ACTIVE,
    lecipmCityId: cityId!,
  };

  const [activeBrokers, brokerRows] = await Promise.all([
    db.user.count({ where: brokerWhere }),
    db.user.findMany({ where: brokerWhere, select: { id: true } }),
  ]);
  const brokerIds = brokerRows.map((b) => b.id);
  if (brokerIds.length === 0) {
    return {
      activeBrokers: 0,
      dealsProcessed: 0,
      engagementRate: 0,
      revenueCents: 0,
      asOfIso,
      scope: "montréal (no active brokers in city yet)",
    };
  }

  const t90 = since(MS_90D);
  const t30 = since(MS_30D);

  const [dealsProcessed, eventCount, revAgg] = await Promise.all([
    db.deal.count({
      where: {
        status: { in: [...CLOSED_STATUSES] },
        updatedAt: { gte: t90 },
        brokerId: { in: brokerIds },
      },
    }),
    db.userBehaviorEvent.count({
      where: {
        userId: { in: brokerIds },
        createdAt: { gte: t30 },
      },
    }),
    db.platformPayment.aggregate({
      _sum: { amountCents: true },
      where: {
        status: "paid",
        userId: { in: brokerIds },
        createdAt: { gte: t90 },
        refundedAmountCents: 0,
      },
    }),
  ]);

  const targetEvents = Math.max(1, brokerIds.length) * EVENTS_PER_BROKER_TARGET_MONTH;
  const engagementRate = Math.min(1, eventCount / targetEvents);
  const revenueCents = revAgg._sum.amountCents ?? 0;

  return {
    activeBrokers,
    dealsProcessed,
    engagementRate,
    revenueCents,
    asOfIso,
    scope: "montréal (lecipmCityId + broker scope)",
  };
}

async function fetchQuebecRollup(db: PrismaClient, asOfIso: string): Promise<LeadershipMetrics> {
  const t90 = since(MS_90D);
  const t30 = since(MS_30D);

  const brokerWhere: Prisma.UserWhereInput = {
    role: PlatformRole.BROKER,
    accountStatus: AccountStatus.ACTIVE,
    OR: [
      { homeRegion: { contains: "QC", mode: "insensitive" } },
      { homeRegion: { contains: "Québec", mode: "insensitive" } },
      { lecipmCity: { region: { contains: "QC", mode: "insensitive" } } },
    ],
  };

  const [activeBrokers, brokerRows] = await Promise.all([
    db.user.count({ where: brokerWhere }),
    db.user.findMany({ where: brokerWhere, select: { id: true } }),
  ]);
  const brokerIds = brokerRows.map((b) => b.id);
  if (brokerIds.length === 0) {
    return {
      activeBrokers: 0,
      dealsProcessed: 0,
      engagementRate: 0,
      revenueCents: 0,
      asOfIso,
      scope: "québec (no qualifying brokers — refine homeRegion / city data)",
    };
  }

  const [dealsProcessed, eventCount, revAgg] = await Promise.all([
    db.deal.count({
      where: {
        status: { in: [...CLOSED_STATUSES] },
        updatedAt: { gte: t90 },
        jurisdiction: "QC",
        brokerId: { in: brokerIds },
      },
    }),
    db.userBehaviorEvent.count({
      where: { userId: { in: brokerIds }, createdAt: { gte: t30 } },
    }),
    db.platformPayment.aggregate({
      _sum: { amountCents: true },
      where: {
        status: "paid",
        userId: { in: brokerIds },
        createdAt: { gte: t90 },
        refundedAmountCents: 0,
      },
    }),
  ]);

  const targetEvents = Math.max(1, brokerIds.length) * EVENTS_PER_BROKER_TARGET_MONTH;
  return {
    activeBrokers,
    dealsProcessed,
    engagementRate: Math.min(1, eventCount / targetEvents),
    revenueCents: revAgg._sum.amountCents ?? 0,
    asOfIso,
    scope: "québec (homeRegion / lecipm city region heuristics)",
  };
}
