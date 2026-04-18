import type { GeoPerformance, GeoPerformanceRowInput } from "./v4-types";

export function computeGeoPerformance(rows: GeoPerformanceRowInput[]): GeoPerformance[] {
  return rows.map((r) => {
    const ctr = r.clicks / Math.max(r.impressions, 1);
    const conversionRate = r.bookings / Math.max(r.clicks, 1);
    const roas = r.spend > 0 ? r.revenue / r.spend : 0;

    return {
      geo: r.geo,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      bookings: r.bookings,
      revenue: r.revenue,
      spend: r.spend,
      ctr,
      conversionRate,
      roas,
    };
  });
}

export function rankGeoPerformance(data: GeoPerformance[]): GeoPerformance[] {
  return [...data].sort((a, b) => b.roas - a.roas);
}
