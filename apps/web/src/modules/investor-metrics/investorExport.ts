import type { MetricSnapshot } from "@prisma/client";
import { utcDayStart } from "./metricsEngine";

export function csvEscapeField(v: string | number): string {
  const t = String(v);
  if (t.includes(",") || t.includes('"') || t.includes("\n")) {
    return `"${t.replace(/"/g, '""')}"`;
  }
  return t;
}

const CSV_HEADER = [
  "date",
  "total_users",
  "active_users",
  "total_listings",
  "bookings_30d",
  "revenue_30d",
  "conversion_rate",
] as const;

/**
 * Investor-ready CSV of daily `MetricSnapshot` rows (chronological).
 */
export function buildMetricSnapshotsCsv(rows: MetricSnapshot[]): string {
  const chronological = [...rows].sort((a, b) => utcDayStart(a.date).getTime() - utcDayStart(b.date).getTime());
  const lines = [
    CSV_HEADER.join(","),
    ...chronological.map((r) =>
      [
        utcDayStart(r.date).toISOString().slice(0, 10),
        r.totalUsers,
        r.activeUsers,
        r.totalListings,
        r.bookings,
        r.revenue,
        r.conversionRate,
      ]
        .map(csvEscapeField)
        .join(",")
    ),
  ];
  return lines.join("\n");
}
