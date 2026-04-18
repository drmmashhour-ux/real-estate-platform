import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEventLogConversionRollup } from "@/src/modules/conversion/conversion-metrics.service";
import { buildFsboSegmentWhere } from "./segmentation.service";
import type { MetricsSegment } from "./metrics.types";

export async function countNewUsers(from: Date, toExclusive: Date): Promise<number> {
  return prisma.user.count({
    where: { createdAt: { gte: from, lt: toExclusive } },
  });
}

/**
 * Users with event activity in range who existed before the range (proxy for “returning”).
 */
export async function countReturningUsersProxy(from: Date, toExclusive: Date): Promise<number> {
  const rows = await prisma.eventLog.findMany({
    where: {
      createdAt: { gte: from, lt: toExclusive },
      userId: { not: null },
      user: { createdAt: { lt: from } },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.length;
}

export async function countNewListingsInRange(
  from: Date,
  toExclusive: Date,
  segment: MetricsSegment
): Promise<number> {
  const fsboWhere = buildFsboSegmentWhere(segment);
  const fsboBase = {
    createdAt: { gte: from, lt: toExclusive },
    NOT: { status: "DRAFT" as const },
    ...fsboWhere,
  };
  const ch = segment.listingChannel;
  if (ch === "fsbo_sale") {
    return prisma.fsboListing.count({ where: fsboBase });
  }
  if (ch === "bnhub_stay") {
    return prisma.shortTermListing.count({
      where: { createdAt: { gte: from, lt: toExclusive } },
    });
  }
  if (ch === "crm_listing") {
    return prisma.listing.count({
      where: { createdAt: { gte: from, lt: toExclusive } },
    });
  }
  const [fsbo, st, crm] = await Promise.all([
    prisma.fsboListing.count({ where: fsboBase }),
    prisma.shortTermListing.count({
      where: { createdAt: { gte: from, lt: toExclusive } },
    }),
    prisma.listing.count({
      where: { createdAt: { gte: from, lt: toExclusive } },
    }),
  ]);
  return fsbo + st + crm;
}

export async function countActiveListingsSnapshot(segment: MetricsSegment): Promise<{
  fsbo: number;
  bnhub: number;
  crm: number;
}> {
  const fsboWhere = {
    status: "ACTIVE" as const,
    moderationStatus: "APPROVED" as const,
    ...buildFsboSegmentWhere(segment),
  };
  const [fsbo, bnhub, crm] = await Promise.all([
    prisma.fsboListing.count({ where: fsboWhere }),
    prisma.shortTermListing.count({
      where: { listingStatus: ListingStatus.PUBLISHED },
    }),
    prisma.listing.count(),
  ]);
  return { fsbo, bnhub, crm };
}

export async function getEngagementCounts(since: Date) {
  const types = ["listing_impression", "listing_click", "listing_save", "listing_share"] as const;
  const rows = await prisma.eventLog.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since }, eventType: { in: [...types] } },
    _count: { _all: true },
  });
  const m = Object.fromEntries(rows.map((r) => [r.eventType, r._count._all])) as Record<string, number>;
  return {
    listingImpressions: m.listing_impression ?? 0,
    listingClicks: m.listing_click ?? 0,
    listingSaves: m.listing_save ?? 0,
    shares: m.listing_share ?? 0,
  };
}

export async function getPlatformRevenueBreakdown(from: Date, toExclusive: Date) {
  const rows = await prisma.platformRevenueEvent.groupBy({
    by: ["revenueType"],
    where: { createdAt: { gte: from, lt: toExclusive }, status: "realized" },
    _sum: { amountCents: true },
  });
  const map = Object.fromEntries(
    rows.map((r) => [r.revenueType, r._sum.amountCents ?? 0])
  ) as Record<string, number>;

  const platformFees =
    (map.guest_service_fee ?? 0) + (map.host_fee ?? 0) + (map.transaction_fee ?? 0);
  const featured = map.promotion ?? 0;
  const subscription = map.subscription ?? 0;
  /** BNHub commissions approximated from revenue types containing fee on stay */
  const bnhubCommission = map.transaction_fee ?? 0;

  return {
    platformFeesCents: platformFees,
    featuredRevenueCents: featured,
    subscriptionRevenueCents: subscription,
    bnhubCommissionCents: bnhubCommission,
    totalRevenueCents: rows.reduce((s, r) => s + (r._sum.amountCents ?? 0), 0),
  };
}

export { getEventLogConversionRollup };
