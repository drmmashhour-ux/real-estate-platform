import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import type { BNHubConversionAdminOverview, BNHubListingFunnelAdminRow } from "./bnhub-guest-conversion.types";
import { recordBnhubAnalyzerRun, recordBnhubInsightsGenerated } from "./bnhub-conversion-monitoring.service";
import { bnhubConversionMetricsFromRawCounts } from "./bnhub-guest-conversion-metrics";
import { computeWeakestStep } from "./bnhub-conversion-funnel-diagnostics";

function funnelRatesFromTotals(args: {
  searchViews: number;
  listingClicks: number;
  listingViews: number;
  bookingStarted: number;
  bookingCompleted: number;
}) {
  const { searchViews, listingClicks, listingViews, bookingStarted, bookingCompleted } = args;
  return {
    searchToClick: searchViews > 0 ? listingClicks / searchViews : null,
    clickToView: listingClicks > 0 ? listingViews / listingClicks : null,
    viewToBookingStart: listingViews > 0 ? bookingStarted / listingViews : null,
    startToCompleted: bookingStarted > 0 ? bookingCompleted / bookingStarted : null,
  };
}

function deltaPctPoints(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || !Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  return (cur - prev) * 100;
}

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

  const searchViews = countFor("search_view");
  const listingClicks = countFor("listing_click");
  const listingViews = countFor("listing_view");
  const bookingStarted = countFor("booking_started");
  const bookingCompleted = countFor("booking_completed");

  const searchToClick = searchViews > 0 ? listingClicks / searchViews : null;
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

  const groupedByListing = await prisma.aiConversionSignal.groupBy({
    by: ["listingId", "eventType"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  type Agg = {
    impressions: number;
    clicks: number;
    views: number;
    bookingStarts: number;
    bookingsCompleted: number;
  };

  const emptyAgg = (): Agg => ({
    impressions: 0,
    clicks: 0,
    views: 0,
    bookingStarts: 0,
    bookingsCompleted: 0,
  });

  const perListing = new Map<string, Agg>();
  for (const row of groupedByListing) {
    let a = perListing.get(row.listingId);
    if (!a) {
      a = emptyAgg();
      perListing.set(row.listingId, a);
    }
    const n = row._count._all;
    switch (row.eventType) {
      case "search_view":
        a.impressions += n;
        break;
      case "listing_click":
        a.clicks += n;
        break;
      case "listing_view":
        a.views += n;
        break;
      case "booking_started":
        a.bookingStarts += n;
        break;
      case "booking_completed":
        a.bookingsCompleted += n;
        break;
      default:
        break;
    }
  }

  const funnelRowCandidates = [...perListing.entries()]
    .map(([listingId, a]) => ({ listingId, a }))
    .filter(({ a }) => a.views >= 8 || a.impressions >= 25 || a.clicks >= 12);

  const funnelMetaIds = funnelRowCandidates.map((x) => x.listingId);
  const funnelMeta =
    funnelMetaIds.length > 0
      ? await prisma.shortTermListing.findMany({
          where: { id: { in: funnelMetaIds } },
          select: { id: true, title: true, city: true },
        })
      : [];
  const funnelMetaById = new Map(funnelMeta.map((m) => [m.id, m] as const));

  const listingFunnelRows: BNHubListingFunnelAdminRow[] = funnelRowCandidates
    .map(({ listingId, a }) => {
      const m = bnhubConversionMetricsFromRawCounts({
        impressions: a.impressions,
        clicks: a.clicks,
        views: a.views,
        bookingStarts: a.bookingStarts,
        bookingsCompleted: a.bookingsCompleted,
      });
      const w = computeWeakestStep(m);
      const meta = funnelMetaById.get(listingId);
      return {
        listingId,
        title: meta?.title ?? null,
        city: meta?.city ?? null,
        searchViews: a.impressions,
        clicks: a.clicks,
        listingViews: a.views,
        bookingStarts: a.bookingStarts,
        bookingsCompleted: a.bookingsCompleted,
        clickRate: m.ctr,
        listingViewRate: m.viewRate,
        startRate: m.viewToStartRate,
        completionRate: m.startToPaidRate,
        weakestStep: w.step,
        weakestStepLabel: w.label,
      };
    })
    .sort((x, y) => y.listingViews - x.listingViews)
    .slice(0, 18);

  recordBnhubInsightsGenerated(listingFunnelRows.length, { scope: "admin_listing_funnel" });

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
      searchViews,
    },
    funnel: {
      clickToView,
      viewToBookingStart,
      startToCompleted,
      searchToClick,
    },
    globalDropOff,
    measurementComparison,
    topByBookings,
    weakestByViews,
    listingFunnelRows,
  };
}
