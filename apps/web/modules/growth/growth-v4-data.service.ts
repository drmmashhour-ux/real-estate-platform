/**
 * Loads real inputs for Growth Engine V4 from `growth_events`, manual spend, and user activity.
 * No synthetic ROAS — revenue uses booking metadata `amountCents` when present, else 0.
 */
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getManualSpendAggregatedForAdsWindow } from "@/modules/ads/growth-ops-manual-spend.service";
import { GrowthEventName } from "@/modules/growth/event-types";
import type { CampaignBudgetInput, GeoPerformanceRowInput, UserSegmentSignals } from "@/services/growth/v4-types";
import { runGrowthV4, type GrowthV4Result } from "@/services/growth/v4-orchestrator.service";
import { getGrowthV4RunHistory, type GrowthV4HistorySnapshot } from "./growth-v4-history.service";

export type GrowthV4DashboardPayload = GrowthV4Result & {
  runHistory: GrowthV4HistorySnapshot[];
  latestRun: GrowthV4HistorySnapshot | null;
};

function windowBounds(rangeDays: number, offsetDays = 0): { since: Date; until: Date } {
  const until = new Date(Date.now() - offsetDays * 864e5);
  const since = new Date(until.getTime() - rangeDays * 864e5);
  return { since, until };
}

function num(n: bigint | number): number {
  return typeof n === "bigint" ? Number(n) : n;
}

export async function loadGeoPerformanceRows(rangeDays: number): Promise<GeoPerformanceRowInput[]> {
  const { since, until } = windowBounds(rangeDays, 0);

  const rows = await prisma.$queryRaw<
    Array<{
      country: string;
      region: string;
      city: string;
      impressions: bigint;
      clicks: bigint;
      leads: bigint;
      bookings: bigint;
      revenue_cents: bigint;
    }>
  >(Prisma.sql`
    SELECT
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'country'), ''), '(unknown)') AS country,
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'region'), ''), '') AS region,
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'city'), ''), '') AS city,
      COUNT(*) FILTER (WHERE event_name = 'landing_view')::bigint AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'cta_click')::bigint AS clicks,
      COUNT(*) FILTER (WHERE event_name = 'lead_capture')::bigint AS leads,
      COUNT(*) FILTER (WHERE event_name = 'booking_completed')::bigint AS bookings,
      COALESCE(
        SUM(
          CASE
            WHEN event_name = 'booking_completed'
              AND (COALESCE(metadata, '{}'::jsonb)::jsonb->>'amountCents') ~ '^[0-9]+$'
            THEN (COALESCE(metadata, '{}'::jsonb)::jsonb->>'amountCents')::bigint
            ELSE 0::bigint
          END
        ),
        0::bigint
      ) AS revenue_cents
    FROM growth_events
    WHERE created_at >= ${since} AND created_at < ${until}
    GROUP BY 1, 2, 3
  `);

  const spendAgg = await getManualSpendAggregatedForAdsWindow(rangeDays, 0);
  const totalSpend = spendAgg.totalDollars;
  const totalClicks = rows.reduce((s, r) => s + num(r.clicks), 0);

  return rows.map((r) => {
    const clicks = num(r.clicks);
    const spend =
      totalClicks > 0 ? totalSpend * (clicks / totalClicks) : rows.length > 0 ? totalSpend / rows.length : 0;
    return {
      geo: {
        country: r.country,
        region: r.region || undefined,
        city: r.city || undefined,
      },
      impressions: num(r.impressions),
      clicks,
      leads: num(r.leads),
      bookings: num(r.bookings),
      revenue: num(r.revenue_cents) / 100,
      spend: Math.round(spend * 100) / 100,
    };
  });
}

export async function loadCampaignBudgetInputs(rangeDays: number): Promise<CampaignBudgetInput[]> {
  const { since, until } = windowBounds(rangeDays, 0);

  const rows = await prisma.$queryRaw<
    Array<{
      campaign_key: string;
      impressions: bigint;
      clicks: bigint;
      revenue_cents: bigint;
    }>
  >(Prisma.sql`
    SELECT
      COALESCE(NULLIF(TRIM(utm_campaign), ''), '(unset)') AS campaign_key,
      COUNT(*) FILTER (WHERE event_name = 'landing_view')::bigint AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'cta_click')::bigint AS clicks,
      COALESCE(
        SUM(
          CASE
            WHEN event_name = 'booking_completed'
              AND (COALESCE(metadata, '{}'::jsonb)::jsonb->>'amountCents') ~ '^[0-9]+$'
            THEN (COALESCE(metadata, '{}'::jsonb)::jsonb->>'amountCents')::bigint
            ELSE 0::bigint
          END
        ),
        0::bigint
      ) AS revenue_cents
    FROM growth_events
    WHERE created_at >= ${since} AND created_at < ${until}
    GROUP BY 1
  `);

  const spendAgg = await getManualSpendAggregatedForAdsWindow(rangeDays, 0);

  return rows.map((r) => {
    const id = r.campaign_key;
    const budget = spendAgg.byCampaign[id] ?? 0;
    const revenue = num(r.revenue_cents) / 100;
    const roas = budget > 0 ? revenue / budget : 0;
    return {
      id,
      budget,
      roas,
      clicks: num(r.clicks),
      impressions: num(r.impressions),
    };
  });
}

export async function loadUserSegmentSignals(userId: string, rangeDays = 30): Promise<UserSegmentSignals> {
  const { since } = windowBounds(rangeDays, 0);

  const [totalBookings, pendingBooking, lastGrowth, pagesViewed, startedGrowth, completedGrowth] =
    await Promise.all([
    prisma.booking.count({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.booking.findFirst({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] },
      },
      select: { id: true },
    }),
    prisma.growthEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.growthEvent.count({
      where: {
        userId,
        createdAt: { gte: since },
        eventName: { in: [GrowthEventName.LANDING_VIEW, GrowthEventName.PAGE_VIEW] },
      },
    }),
    prisma.growthEvent.findFirst({
      where: { userId, eventName: GrowthEventName.BOOKING_STARTED },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.growthEvent.findFirst({
      where: { userId, eventName: GrowthEventName.BOOKING_COMPLETED },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  return {
    totalBookings,
    lastVisit: lastGrowth?.createdAt.getTime(),
    pagesViewed,
    bookingStarted: !!startedGrowth || !!pendingBooking,
    bookingCompleted: !!completedGrowth && !pendingBooking,
  };
}

export async function getGrowthV4DashboardPayload(userId: string, rangeDays = 14): Promise<GrowthV4DashboardPayload> {
  const [geoData, campaigns, user, hist] = await Promise.all([
    loadGeoPerformanceRows(rangeDays),
    loadCampaignBudgetInputs(rangeDays),
    loadUserSegmentSignals(userId, rangeDays),
    getGrowthV4RunHistory(20),
  ]);

  const v4 = await runGrowthV4({
    campaigns,
    geoData,
    user,
  });

  return {
    ...v4,
    runHistory: hist.history,
    latestRun: hist.latest,
  };
}
