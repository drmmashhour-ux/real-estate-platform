import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { syriaPlatformConfig } from "@/config/syria-platform.config";

const cfg = syriaPlatformConfig.sybn113;

/** Stable hashed IP for analytics / dedupe (no raw IPs stored). */
export function hashSybn113ClientIp(ip: string): string {
  const trimmed = ip.trim() || "0";
  return createHash("sha256").update(`sybn113|${trimmed}`).digest("hex").slice(0, 32);
}

export function utcDayStart(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function utcDayKey(): string {
  return utcDayStart().toISOString().slice(0, 10);
}

/** Growth-event filter: undiluted `listing_shared` (payload.sybn113.diluted !== true). */
export const undilutedListingSharedWhere = {
  NOT: { payload: { path: ["sybn113", "diluted"], equals: true } },
} as const;

export type ListingShareDecision =
  | { allowed: false; reason: "daily_limit" }
  | { allowed: true; diluted: boolean; ipHash: string };

/**
 * ORDER SYBNB-113 — rate limit shares per actor/day; burst-share same listing reduces tracking weight.
 */
export async function evaluateListingShareAbuse(input: {
  userId: string | null;
  ipHash: string;
  propertyId: string;
}): Promise<ListingShareDecision> {
  const { userId, ipHash, propertyId } = input;
  const dayStart = utcDayStart();
  const burstSince = new Date(Date.now() - cfg.burstWindowMs);

  if (userId) {
    const daily = await prisma.syriaGrowthEvent.count({
      where: {
        eventType: "listing_shared",
        userId,
        createdAt: { gte: dayStart },
      },
    });
    if (daily >= cfg.maxSharesPerActorPerUtcDay) {
      return { allowed: false, reason: "daily_limit" };
    }
    const burst = await prisma.syriaGrowthEvent.count({
      where: {
        eventType: "listing_shared",
        propertyId,
        userId,
        createdAt: { gte: burstSince },
      },
    });
    const diluted = burst >= cfg.burstMaxFullWeightSharesSameListing;
    return { allowed: true, diluted, ipHash };
  }

  const dailyAnon = await prisma.syriaGrowthEvent.count({
    where: {
      eventType: "listing_shared",
      userId: null,
      createdAt: { gte: dayStart },
      payload: { path: ["sybn113", "ipHash"], equals: ipHash },
    },
  });
  if (dailyAnon >= cfg.maxSharesPerActorPerUtcDay) {
    return { allowed: false, reason: "daily_limit" };
  }

  const burstAnon = await prisma.syriaGrowthEvent.count({
    where: {
      eventType: "listing_shared",
      propertyId,
      userId: null,
      createdAt: { gte: burstSince },
      payload: { path: ["sybn113", "ipHash"], equals: ipHash },
    },
  });
  const diluted = burstAnon >= cfg.burstMaxFullWeightSharesSameListing;
  return { allowed: true, diluted, ipHash };
}

/**
 * ORDER SYBNB-113 — boost feed rank only when growth funnel is coherent (non-diluted share → attributed visit → contact).
 */
export async function computeSybn113ViralityTrustBoost(propertyId: string): Promise<number> {
  const ms = cfg.viralityWindowDays * 86400000;
  const since = new Date(Date.now() - ms);

  const [shares, attributedViews, contacts] = await Promise.all([
    prisma.syriaGrowthEvent.count({
      where: {
        propertyId,
        eventType: "listing_shared",
        createdAt: { gte: since },
        ...undilutedListingSharedWhere,
      },
    }),
    prisma.syriaGrowthEvent.count({
      where: {
        propertyId,
        eventType: "listing_view",
        createdAt: { gte: since },
        OR: [
          { payload: { path: ["shareSource"], equals: "whatsapp" } },
          { payload: { path: ["shareSource"], equals: "copy_link" } },
        ],
      },
    }),
    prisma.syriaGrowthEvent.count({
      where: {
        propertyId,
        eventType: "contact_click",
        createdAt: { gte: since },
      },
    }),
  ]);

  if (shares >= 1 && attributedViews >= 1 && contacts >= 1) {
    return cfg.viralityTrustBoostPoints;
  }
  return 0;
}

export async function countUndilutedListingSharesSince(since: Date): Promise<number> {
  return prisma.syriaGrowthEvent.count({
    where: {
      eventType: "listing_shared",
      createdAt: { gte: since },
      ...undilutedListingSharedWhere,
    },
  });
}

export async function topListingsByUndilutedSharesSince(
  since: Date,
  take = 10,
): Promise<{ propertyId: string; count: number }[]> {
  const rows = await prisma.syriaGrowthEvent.groupBy({
    by: ["propertyId"],
    where: {
      eventType: "listing_shared",
      createdAt: { gte: since },
      propertyId: { not: null },
      ...undilutedListingSharedWhere,
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });
  return rows.map((r) => ({ propertyId: r.propertyId!, count: r._count.id }));
}
