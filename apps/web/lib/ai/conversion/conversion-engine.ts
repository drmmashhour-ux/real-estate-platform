import "server-only";

import type { ListingConversionInsight } from "@/lib/ai/conversion/conversion-types";
import type { PrismaClient } from "@prisma/client";
import { BookingStatus, SearchEventType } from "@prisma/client";
import { subDays } from "date-fns";

const WINDOW_DAYS = 30;

function ratio(num: number, den: number): number | null {
  if (den <= 0) return null;
  return num / den;
}

/** Heuristic aggregates for the dashboard — read-only ratios from SearchEvent + Booking. */
export async function getHostConversionInsights(
  db: PrismaClient,
  hostUserId: string
): Promise<ListingConversionInsight[]> {
  const since = subDays(new Date(), WINDOW_DAYS);
  const listings = await db.shortTermListing.findMany({
    where: { ownerId: hostUserId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 32,
  });

  if (listings.length === 0) return [];

  const ids = listings.map((l) => l.id);

  const [viewGroups, startGroups, completedGroups] = await Promise.all([
    db.searchEvent.groupBy({
      by: ["listingId"],
      where: {
        listingId: { in: ids },
        eventType: SearchEventType.VIEW,
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
    db.booking.groupBy({
      by: ["listingId"],
      where: {
        listingId: { in: ids },
        createdAt: { gte: since },
        status: { notIn: [BookingStatus.DECLINED, BookingStatus.EXPIRED] },
      },
      _count: { _all: true },
    }),
    db.booking.groupBy({
      by: ["listingId"],
      where: {
        listingId: { in: ids },
        status: BookingStatus.COMPLETED,
        checkOut: { gte: since },
      },
      _count: { _all: true },
    }),
  ]);

  const viewMap = new Map<string, number>();
  for (const g of viewGroups) {
    if (g.listingId) viewMap.set(g.listingId, g._count._all);
  }
  const startMap = new Map<string, number>();
  for (const g of startGroups) startMap.set(g.listingId, g._count._all);
  const doneMap = new Map<string, number>();
  for (const g of completedGroups) doneMap.set(g.listingId, g._count._all);

  const rows: ListingConversionInsight[] = [];

  for (const l of listings) {
    const listingViews = viewMap.get(l.id) ?? 0;
    const bookingStarts = startMap.get(l.id) ?? 0;
    const bookingsCompleted = doneMap.get(l.id) ?? 0;

    const conversionRate = ratio(bookingsCompleted, listingViews);
    const bookingStartRate = ratio(bookingStarts, listingViews);
    const abandonmentRate = bookingStarts > 0 ? ratio(bookingStarts - bookingsCompleted, bookingStarts) : null;

    const lowConversion =
      listingViews >= 12 && conversionRate !== null && conversionRate < 0.025 && bookingStarts >= 2;

    let explanation =
      "Recorded from search views, booking attempts created in the last 30 days, and stays completed since the same cutoff. Rates are descriptive ratios for host guidance — not advice or payouts.";

    if (listingViews === 0) {
      explanation =
        "No search views recorded for this listing in the window. When traffic resumes, revisit photos, nightly price bands, and availability in BNHUB.";
    }

    rows.push({
      listingId: l.id,
      title: l.title,
      metrics: {
        listingViews,
        bookingStarts,
        bookingsCompleted,
        conversionRate,
        bookingStartRate,
        abandonmentRate,
        lowConversion,
        explanation,
      },
      recommendations: lowConversion
        ? [
            {
              listingId: l.id,
              type: "pricing_review",
              summary: "Review pricing and positioning vs similar listings",
              priority: "medium",
              reasons: [
                "Completed stays divided by listing views looks low versus traffic.",
                "Check BNHUB listing editor rules, calendars, and photos before changing rate.",
              ],
            },
          ]
        : [],
      decisionSuppressed: false,
      trustRankingBoostApplied: false,
    });
  }

  rows.sort((a, b) => Number(b.metrics.lowConversion) - Number(a.metrics.lowConversion));
  return rows;
}
