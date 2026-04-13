import type { MetricSnapshot } from "@prisma/client";
import type { InvestorPlatformFunnel } from "./investorFunnel";
import type { FinancialProjections } from "./investorProjections";
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

const FUNNEL_HEADER = [
  "generated_at",
  "window_days",
  "visitor_sessions",
  "page_view_events",
  "search_listing_views",
  "crm_listing_views",
  "bookings_created",
  "bookings_confirmed_completed",
  "payments_completed",
  "payment_volume_cents",
  "rate_session_to_view",
  "rate_view_to_booking",
  "rate_booking_to_payment",
  "rate_session_to_payment",
] as const;

export function buildFunnelSnapshotCsv(f: InvestorPlatformFunnel): string {
  const r = f.rates;
  const row = [
    f.generatedAt,
    f.windowDays,
    f.visitorSessions,
    f.pageViewEvents,
    f.searchListingViews,
    f.crmListingViews,
    f.bookingsCreated,
    f.bookingsConfirmedOrCompleted,
    f.paymentsCompleted,
    f.paymentVolumeCents,
    r.sessionToListingView ?? "",
    r.listingViewToBooking ?? "",
    r.bookingToPayment ?? "",
    r.sessionToPayment ?? "",
  ];
  return [FUNNEL_HEADER.join(","), row.map(csvEscapeField).join(",")].join("\n");
}

const PROJECTION_HEADER = [
  "generated_at",
  "revenue_trailing_30d",
  "revenue_prior_30d",
  "mom_revenue_pct",
  "annual_run_rate",
  "projected_revenue_90d",
  "mom_user_signups_pct",
] as const;

export function buildProjectionsCsv(p: FinancialProjections): string {
  const row = [
    p.generatedAt,
    p.revenueTrailing30d,
    p.revenuePrior30d ?? "",
    p.monthOverMonthRevenuePct ?? "",
    p.annualRunRate,
    p.projectedRevenue90d,
    p.monthOverMonthUsersPct ?? "",
  ];
  return [PROJECTION_HEADER.join(","), row.map(csvEscapeField).join(",")].join("\n");
}

/** JSON series for dashboard charts / BI (same basis as snapshot CSV, chronological). */
export function buildChartSeriesExport(rows: MetricSnapshot[]): string {
  const chronological = [...rows].sort((a, b) => utcDayStart(a.date).getTime() - utcDayStart(b.date).getTime());
  const series = chronological.map((r) => ({
    date: utcDayStart(r.date).toISOString().slice(0, 10),
    total_users: r.totalUsers,
    active_users: r.activeUsers,
    total_listings: r.totalListings,
    bookings_30d: r.bookings,
    revenue_30d: r.revenue,
    conversion_rate: r.conversionRate,
    conversion_pct: r.conversionRate * 100,
  }));
  return JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      description:
        "Daily MetricSnapshot rows for charting (users, bookings, revenue, lead conversion). conversion_rate is 0–1.",
      row_count: series.length,
      series,
    },
    null,
    2,
  );
}
