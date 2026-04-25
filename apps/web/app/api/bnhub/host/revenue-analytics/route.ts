import { getGuestId } from "@/lib/auth/session";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { buildHostRevenueInsightsFromMetrics } from "@/modules/host-analytics/insights.engine";
import type { HostRevenueMetrics } from "@/modules/host-analytics/host-analytics.types";
import { buildHostRevenueMetrics, computeWeekendWeekdayAdr } from "@/modules/host-analytics/metrics.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function metricsToCsv(metrics: HostRevenueMetrics): string {
  const rows: string[] = [
    "section,key,value,extra",
    `summary,totalRevenueCents,${metrics.totalRevenueCents},`,
    `summary,occupiedNights,${metrics.occupiedNights},`,
    `summary,availableNights,${metrics.availableNights},`,
    `summary,occupancyRate,${metrics.occupancyRate ?? ""},`,
    `summary,avgNightlyRateCents,${metrics.avgNightlyRateCents ?? ""},`,
    `summary,bookingConversionRate,${metrics.bookingConversionRate ?? ""},`,
    `summary,cancellationRate,${metrics.cancellationRate ?? ""},`,
    `breakdown,baseNightlyCents,${metrics.breakdown.baseNightlyCents},`,
    `breakdown,cleaningCents,${metrics.breakdown.cleaningCents},`,
    `breakdown,guestServiceFeeCents,${metrics.breakdown.guestServiceFeeCents},`,
  ];
  for (const p of metrics.series.daily) {
    rows.push(
      `daily,${csvEscape(p.label)},${p.revenueCents},${p.occupiedNights}`,
    );
  }
  for (const r of metrics.listingBreakdown) {
    rows.push(
      `listing,${csvEscape(r.listingCode)},${r.revenueCents},${csvEscape(r.title)}`,
    );
  }
  return rows.join("\n");
}

/**
 * GET — BNHub host revenue, occupancy, and series from real bookings.
 * Query: `days` (7–366, default 90), `listingId` (optional), `format=csv`.
 */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(366, Math.max(7, Number(url.searchParams.get("days")) || 90));
  const listingId = url.searchParams.get("listingId")?.trim() || null;
  const format = url.searchParams.get("format")?.toLowerCase() ?? "";

  if (listingId) {
    const owned = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });
    if (!owned) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
  }

  const end = new Date(utcDayStart(new Date()).getTime() + 86400000);
  const start = new Date(end.getTime() - days * 86400000);
  const spanMs = end.getTime() - start.getTime();

  const [current, prior] = await Promise.all([
    buildHostRevenueMetrics({
      hostUserId: userId,
      rangeStart: start,
      rangeEnd: end,
      listingId,
    }),
    buildHostRevenueMetrics({
      hostUserId: userId,
      rangeStart: new Date(start.getTime() - spanMs),
      rangeEnd: start,
      listingId,
    }),
  ]);

  const listingIds =
    listingId != null ? [listingId] : current.listingBreakdown.map((r) => r.listingId);

  const adrSplit =
    listingIds.length > 0
      ? await computeWeekendWeekdayAdr({
          listingIds,
          rangeStart: start,
          rangeEnd: end,
        })
      : null;

  const insights = buildHostRevenueInsightsFromMetrics(current, prior, adrSplit);

  if (format === "csv") {
    const body = metricsToCsv(current);
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bnhub-host-analytics-${days}d.csv"`,
      },
    });
  }

  return Response.json({
    days,
    metrics: current,
    insights,
    priorRange: {
      startUtc: new Date(start.getTime() - spanMs).toISOString(),
      endUtc: start.toISOString(),
    },
  });
}
