/**
 * Geo-aware hints from growth_events metadata when present — never fabricates regions.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GeoLearningSummary, GeoPerformanceSlice } from "./ads-automation-v4.types";

function ratio(n: number, d: number): number {
  if (d <= 0) return 0;
  return n / d;
}

export type GeoMetricsRow = {
  country?: string;
  region?: string;
  city?: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
};

/**
 * Normalize arbitrary rows (e.g. from SQL) into slices + summary.
 */
export function extractGeoPerformanceSlices(rows: GeoMetricsRow[]): GeoPerformanceSlice[] {
  return rows.map((r) => {
    const label = [r.city, r.region, r.country].filter(Boolean).join(", ") || "(unknown)";
    const ctr = ratio(r.clicks, Math.max(1, r.impressions));
    const conversionRate = ratio(r.bookings, Math.max(1, r.clicks));
    return {
      dimension: "geo",
      label,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      bookings: r.bookings,
      ctr,
      conversionRate,
    };
  });
}

export async function summarizeGeoSignalsForCampaign(
  campaignKey: string,
  rangeDays: number,
): Promise<GeoLearningSummary> {
  const rows = await loadGeoRowsForCampaign(campaignKey, rangeDays);
  if (rows.length === 0) {
    return { available: false, reason: "geo_data_unavailable", slices: [] };
  }
  const slices = extractGeoPerformanceSlices(rows);
  const ranked = [...slices].sort((a, b) => b.ctr * b.conversionRate - a.ctr * a.conversionRate);
  return {
    available: true,
    slices,
    topSliceLabel: ranked[0]?.label,
  };
}

async function loadGeoRowsForCampaign(campaignKey: string, rangeDays: number): Promise<GeoMetricsRow[]> {
  const until = new Date();
  const since = new Date(until.getTime() - rangeDays * 864e5);
  const ck = campaignKey.trim() || "(unset)";

  const raw = await prisma.$queryRaw<
    Array<{
      country: string;
      region: string;
      city: string;
      impressions: bigint;
      clicks: bigint;
      leads: bigint;
      bookings: bigint;
    }>
  >(Prisma.sql`
    SELECT
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'country'), ''), '(unknown)') AS country,
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'region'), ''), '') AS region,
      COALESCE(NULLIF(TRIM(COALESCE(metadata, '{}'::jsonb)::jsonb->>'city'), ''), '') AS city,
      COUNT(*) FILTER (WHERE event_name = 'landing_view')::bigint AS impressions,
      COUNT(*) FILTER (WHERE event_name = 'cta_click')::bigint AS clicks,
      COUNT(*) FILTER (WHERE event_name = 'lead_capture')::bigint AS leads,
      COUNT(*) FILTER (WHERE event_name = 'booking_completed')::bigint AS bookings
    FROM growth_events
    WHERE created_at >= ${since}
      AND created_at < ${until}
      AND COALESCE(NULLIF(TRIM(utm_campaign), ''), '(unset)') = ${ck}
    GROUP BY 1, 2, 3
    HAVING COUNT(*) FILTER (WHERE event_name = 'landing_view') > 0
       OR COUNT(*) FILTER (WHERE event_name = 'cta_click') > 0
  `);

  return raw.map((r) => ({
    country: r.country,
    region: r.region || undefined,
    city: r.city || undefined,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    leads: Number(r.leads),
    bookings: Number(r.bookings),
  }));
}

export function rankGeoSlicesByCampaign(campaignKey: string, slices: GeoPerformanceSlice[]): GeoPerformanceSlice[] {
  void campaignKey;
  return [...slices].sort((a, b) => b.ctr * b.conversionRate - a.ctr * a.conversionRate);
}

export function buildGeoReallocationHints(
  summary: GeoLearningSummary,
): { hint: string; safe: boolean }[] {
  if (!summary.available || summary.slices.length === 0) {
    return [{ hint: "Insufficient geo attribution — keep budget flat until country/city metadata exists on events.", safe: true }];
  }
  if (summary.slices.length === 1) {
    return [{ hint: "Single geo bucket — explore duplication in a second region before reallocating.", safe: true }];
  }
  const top = rankGeoSlicesByCampaign("", summary.slices)[0];
  const weak = summary.slices.reduce((a, b) => (a.ctr < b.ctr ? a : b));
  return [
    {
      hint: `Strongest geo by proxy: ${top?.label ?? "n/a"} — consider testing creative there first (manual).`,
      safe: true,
    },
    {
      hint: `Weakest geo signal: ${weak?.label ?? "n/a"} — hold or test variant before cutting spend without external data.`,
      safe: true,
    },
  ];
}
