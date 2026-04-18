import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import type { BNHubConversionAdminOverview } from "./bnhub-guest-conversion.types";
import { recordBnhubAnalyzerRun, recordBnhubInsightsGenerated } from "./bnhub-conversion-monitoring.service";

/**
 * Read-only marketplace rollup from `AiConversionSignal` (last N days).
 */
export async function loadBnhubConversionAdminOverview(windowDays = 30): Promise<BNHubConversionAdminOverview> {
  recordBnhubAnalyzerRun({ scope: "admin_overview" });
  const wd = Math.min(90, Math.max(7, windowDays));
  const since = subDays(new Date(), wd);

  const rows = await prisma.aiConversionSignal.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  const countFor = (t: string) => rows.find((r) => r.eventType === t)?._count._all ?? 0;

  const listingClicks = countFor("listing_click");
  const listingViews = countFor("listing_view");
  const bookingStarted = countFor("booking_started");
  const bookingCompleted = countFor("booking_completed");

  const clickToView = listingClicks > 0 ? listingViews / listingClicks : null;
  const viewToBookingStart = listingViews > 0 ? bookingStarted / listingViews : null;
  const startToCompleted = bookingStarted > 0 ? bookingCompleted / bookingStarted : null;

  const [bookedGroups, viewAgg] = await Promise.all([
    prisma.aiConversionSignal.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since }, eventType: "booking_completed" },
      _count: { _all: true },
    }),
    prisma.aiConversionSignal.groupBy({
      by: ["listingId"],
      where: { createdAt: { gte: since }, eventType: "listing_view" },
      _count: { _all: true },
    }),
  ]);

  const topBooked = [...bookedGroups].sort((a, b) => b._count._all - a._count._all).slice(0, 8);

  const completedByListing = new Map(
    (
      await prisma.aiConversionSignal.groupBy({
        by: ["listingId"],
        where: { createdAt: { gte: since }, eventType: "booking_completed" },
        _count: { _all: true },
      })
    ).map((r) => [r.listingId, r._count._all] as const),
  );

  const weakestCandidates = viewAgg
    .map((v) => ({
      listingId: v.listingId,
      views: v._count._all,
      completed: completedByListing.get(v.listingId) ?? 0,
    }))
    .filter((x) => x.views >= 5 && x.completed === 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const metaIds = [...new Set([...topBooked.map((t) => t.listingId), ...weakestCandidates.map((w) => w.listingId)])];

  const listingMeta =
    metaIds.length > 0
      ? await prisma.shortTermListing.findMany({
          where: { id: { in: metaIds } },
          select: { id: true, title: true, city: true },
        })
      : [];
  const metaById = new Map(listingMeta.map((m) => [m.id, m] as const));

  const topByBookings = topBooked.map((t) => ({
    listingId: t.listingId,
    title: metaById.get(t.listingId)?.title ?? null,
    city: metaById.get(t.listingId)?.city ?? null,
    count: t._count._all,
  }));

  const weakestByViews = weakestCandidates.map((w) => ({
    listingId: w.listingId,
    title: metaById.get(w.listingId)?.title ?? null,
    city: metaById.get(w.listingId)?.city ?? null,
    views: w.views,
    completed: w.completed,
  }));

  recordBnhubInsightsGenerated(weakestByViews.length, { scope: "admin_weakest" });

  return {
    generatedAt: new Date().toISOString(),
    windowDays: wd,
    totals: {
      listingClicks,
      listingViews,
      bookingStarted,
      bookingCompleted,
    },
    funnel: {
      clickToView,
      viewToBookingStart,
      startToCompleted,
    },
    topByBookings,
    weakestByViews,
  };
}
