import { prisma } from "@/lib/db";

import type { GrowthPerformanceSummaryVm } from "./growth-engine.types";

/** Snapshot lightweight metrics before a mutating safe action — used later for outcome comparison. */
export async function snapshotEntityMetrics(entityKind: string, entityId: string | null): Promise<Record<string, unknown>> {
  if (!entityId) return {};
  if (entityKind === "bnhub_listing") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: entityId },
      select: {
        bnhubListingCompletedStays: true,
        aiDiscoveryScore: true,
        nightPriceCents: true,
      },
    });
    return l ?? {};
  }
  if (entityKind === "fsbo_listing") {
    const [f, a] = await Promise.all([
      prisma.fsboListing.findUnique({
        where: { id: entityId },
        select: { featuredBoostScore: true, priceCents: true },
      }),
      prisma.listingAnalytics.findUnique({
        where: { kind_listingId: { kind: "FSBO", listingId: entityId } },
        select: { viewsTotal: true, bookings: true, demandScore: true },
      }),
    ]);
    return { fsbo: f, analytics: a };
  }
  if (entityKind === "crm_listing") {
    const a = await prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: "CRM", listingId: entityId } },
      select: { viewsTotal: true, bookings: true, demandScore: true, contactClicks: true },
    });
    return { analytics: a };
  }
  return {};
}

export async function getGrowthPerformanceSummary(): Promise<GrowthPerformanceSummaryVm> {
  const outcomes = await prisma.lecipmGrowthEngineOutcome.findMany({
    where: { measuredAt: { not: null } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  let bookingSum = 0;
  let engageSum = 0;
  let n = 0;
  for (const o of outcomes) {
    const before = o.metricBefore as Record<string, unknown>;
    const after = (o.metricAfter ?? {}) as Record<string, unknown>;
    const bBook = Number((before.bookingsLast30d as number | undefined) ?? 0);
    const aBook = Number((after.bookingsLast30d as number | undefined) ?? bBook);
    bookingSum += aBook - bBook;
    const bEng = Number((before.viewsTotal as number | undefined) ?? 0);
    const aEng = Number((after.viewsTotal as number | undefined) ?? bEng);
    engageSum += aEng - bEng;
    n += 1;
  }

  return {
    outcomesMeasured: outcomes.length,
    avgBookingDeltaApprox: n ? bookingSum / n : null,
    avgEngagementDeltaApprox: n ? engageSum / n : null,
  };
}
