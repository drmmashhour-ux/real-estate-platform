"use client";

import Link from "next/link";
import { Calendar, DollarSign, Home, MessageSquare, Percent, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { BnhubKpiStat } from "@/components/bnhub/BnhubKpiStat";
import { BnhubBookingStatusDonut, BnhubRevenueLineChart } from "./BnhubHostAnalyticsCharts";

type DashboardPayload = {
  bookingsThisMonth: number;
  occupancyRate: number;
  upcomingGuests: number;
  revenueMTD: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueYTD: number;
  totalEarningsCents: number;
  activeListings: number;
  avgNightlyPriceCents: number;
  revenueByDay: { date: string; cents: number }[];
  bookingStatusBreakdown: { status: string; count: number }[];
  activityFeed: {
    id: string;
    kind: "booking" | "message" | "payment" | "review";
    title: string;
    subtitle: string;
    at: string;
    href: string;
  }[];
};

function kindIcon(kind: DashboardPayload["activityFeed"][0]["kind"]) {
  switch (kind) {
    case "booking":
      return Calendar;
    case "message":
      return MessageSquare;
    case "payment":
      return DollarSign;
    case "review":
      return Star;
    default:
      return TrendingUp;
  }
}

function revenueMomGrowthPct(data: DashboardPayload): number | null {
  const cur = data.revenueThisMonth;
  const prev = data.revenueLastMonth;
  if (prev <= 0 || !Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  return ((cur - prev) / prev) * 100;
}

export function BnhubPremiumHostDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    fetch("/api/bnhub/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <section className="bnhub-card animate-pulse py-10 text-center text-bnhub-text-muted">
        Loading analytics…
      </section>
    );
  }

  const mom = revenueMomGrowthPct(data);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-bnhub-text">Performance</h2>
        <p className="mt-1 text-sm text-bnhub-text-secondary">Real metrics from your listings and completed payouts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <BnhubKpiStat
          icon={DollarSign}
          title="Total earnings"
          value={`$${(data.totalEarningsCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint="Lifetime host payouts"
        />
        <BnhubKpiStat
          icon={Calendar}
          title="Bookings (month)"
          value={String(data.bookingsThisMonth)}
          hint="This calendar month"
        />
        <BnhubKpiStat icon={Home} title="Active listings" value={String(data.activeListings)} hint="Published" />
        <BnhubKpiStat icon={Percent} title="Occupancy" value={`${data.occupancyRate}%`} hint="Last 30 days" />
        <BnhubKpiStat
          icon={TrendingUp}
          title="Avg nightly"
          value={data.avgNightlyPriceCents > 0 ? `$${(data.avgNightlyPriceCents / 100).toFixed(0)}` : "—"}
          hint="Across active listings"
        />
      </div>

      {mom != null ? (
        <div className="-mt-4 rounded-lg border border-bnhub-border bg-bnhub-main px-3 py-2 text-[11px] text-bnhub-text-muted">
          Monthly payout momentum (MTD vs last month total):{" "}
          <span className={mom >= 0 ? "font-semibold text-emerald-400/90" : "font-semibold text-rose-400/90"}>
            {mom >= 0 ? "+" : ""}
            {mom.toFixed(1)}%
          </span>
          . Directional only — not a forecast.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bnhub-card bnhub-card--elevated">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-bnhub-gold">Revenue trend</h3>
            <span className="text-xs text-bnhub-text-muted">14 days · host payout</span>
          </div>
          <BnhubRevenueLineChart data={data.revenueByDay} />
        </div>
        <div className="bnhub-card bnhub-card--elevated">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-bnhub-gold">Bookings by status</h3>
            <p className="mt-1 text-xs text-bnhub-text-muted">All stays on your listings</p>
          </div>
          <BnhubBookingStatusDonut data={data.bookingStatusBreakdown} />
        </div>
      </div>

      <div className="bnhub-card bnhub-card--elevated">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-bnhub-gold">Activity</h3>
          <Link href="/dashboard/bnhub/bookings" className="text-xs font-medium text-bnhub-gold hover:opacity-90">
            View all →
          </Link>
        </div>
        <ul className="divide-y divide-bnhub-border">
          {data.activityFeed.length === 0 ? (
            <li className="py-6 text-center text-sm text-bnhub-text-muted">No recent activity yet.</li>
          ) : (
            data.activityFeed.map((item) => {
              const Icon = kindIcon(item.kind);
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex gap-3 py-3 transition hover:bg-bnhub-main/80">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-bnhub-border bg-bnhub-main">
                      <Icon className="h-4 w-4 text-bnhub-gold" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-bnhub-text">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-bnhub-text-secondary">{item.subtitle}</p>
                      <p className="mt-1 text-[11px] text-bnhub-text-muted">{new Date(item.at).toLocaleString()}</p>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <p className="text-center text-[11px] text-bnhub-text-muted">
        BNHUB analytics are estimates for host operations — not tax or legal advice.
      </p>
    </div>
  );
}
