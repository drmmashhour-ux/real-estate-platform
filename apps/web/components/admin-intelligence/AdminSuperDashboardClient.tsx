"use client";

import Link from "next/link";

import type { AdminSuperDashboardPayload } from "@/modules/admin-intelligence/admin-intelligence.types";
import { formatCadCompactFromCents } from "@/modules/dashboard/services/format-dashboard-currency";

import { ActivityFeed } from "./ActivityFeed";
import { AlertCard } from "./AlertCard";
import { HubPerformanceCard } from "./HubPerformanceCard";
import { InsightCard } from "./InsightCard";
import { RevenueChart } from "./RevenueChart";
import { StatCard } from "./StatCard";

const gold = "#D4AF37";

export function AdminSuperDashboardClient({
  adminBase,
  payload,
}: {
  adminBase: string;
  payload: AdminSuperDashboardPayload;
}) {
  const g = payload.global;
  const growth =
    g.userGrowthPct == null
      ? undefined
      : {
          label:
            g.userGrowthPct >= 0
              ? `User signups +${g.userGrowthPct}% vs prior 30d`
              : `User signups ${g.userGrowthPct}% vs prior 30d`,
          positive: g.userGrowthPct >= 0,
        };

  const revenueTrend =
    payload.revenueGrowthPctVsPriorDay == null
      ? undefined
      : {
          label:
            payload.revenueGrowthPctVsPriorDay >= 0
              ? `Day-over-day platform share +${payload.revenueGrowthPctVsPriorDay}%`
              : `Day-over-day platform share ${payload.revenueGrowthPctVsPriorDay}%`,
          positive: payload.revenueGrowthPctVsPriorDay >= 0,
        };

  const hubOrder = ["bnhub", "broker", "listings", "residence", "investor", "seller", "buyer", "platform"];
  const rank = (k: string) => {
    const i = hubOrder.indexOf(k);
    return i === -1 ? 999 : i;
  };
  const hubsSorted = [...payload.hubPerformance].sort((a, b) => rank(a.hubKey) - rank(b.hubKey));

  return (
    <div className="min-h-screen text-zinc-100" style={{ background: "#030303" }}>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-6 border-b border-white/5 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: gold }}>
              LECIPM · Command
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
              Intelligence control
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-500">
              Revenue, hubs, anomalies, and live signals — built for executive decisions, not charts for their own sake.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`${adminBase}/revenue`}
              className="rounded-full px-5 py-2 font-semibold text-black transition hover:opacity-90"
              style={{ background: gold }}
            >
              Revenue detail
            </Link>
            <Link
              href={`${adminBase}/hubs`}
              className="rounded-full border border-white/10 px-5 py-2 font-semibold text-zinc-300 hover:border-[#D4AF37]/40 hover:text-white"
            >
              Hub breakdown
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Platform share (30d)"
            value={formatCadCompactFromCents(g.totalRevenue30dCents)}
            hint={`${g.transactions30d} paid touches · ${g.listingsTotalApprox.toLocaleString()} listings`}
          />
          <StatCard label="Transactions (30d)" value={`${g.transactions30d}`} hint="Platform payment volume" />
          <StatCard
            label="Active accounts"
            value={`${g.activeUsersApprox.toLocaleString()}`}
            hint={`${g.bookingsToday} bookings · ${g.leadsToday} leads today`}
          />
          <StatCard
            label="Momentum"
            value={
              g.userGrowthPct == null ? "—" : `${g.userGrowthPct > 0 ? "+" : ""}${g.userGrowthPct}%`
            }
            hint="New users vs prior 30d"
            trend={growth}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart series14d={payload.revenueSeries14d} revenue30dCents={g.totalRevenue30dCents} />
          </div>
          <StatCard
            label="Today vs 7-day avg"
            value={formatCadCompactFromCents(payload.revenueTodayCents)}
            hint={`Rolling avg ${formatCadCompactFromCents(payload.revenueSevenDayAvgCents)}`}
            trend={revenueTrend}
          />
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
                Hub performance
              </p>
              <h2 className="font-serif text-2xl text-white">Where value is forming</h2>
            </div>
            <Link href={`${adminBase}/hubs`} className="text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-[#D4AF37]">
              Compare →
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hubsSorted.slice(0, 6).map((row) => (
              <HubPerformanceCard key={row.hubKey} row={row} adminBase={adminBase} />
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
                  Narrative insights
                </p>
                <h2 className="font-serif text-2xl text-white">Operational intelligence</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {payload.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
                  Anomalies
                </p>
                <h2 className="font-serif text-2xl text-white">Signals that need eyes</h2>
              </div>
              <Link href={`${adminBase}/anomalies`} className="text-xs font-semibold text-zinc-500 hover:text-[#D4AF37]">
                Drill in →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {payload.anomalies.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/40 px-4 py-8 text-center text-sm text-zinc-500">
                  No active anomaly rules fired. System looks steady.
                </p>
              ) : (
                payload.anomalies.map((a) => <AlertCard key={a.id} anomaly={a} adminBase={adminBase} />)
              )}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <ActivityFeed items={payload.recentActivity} adminBase={adminBase} />
        </section>

        <p className="mt-10 text-center text-[11px] tracking-widest text-zinc-600">
          Snapshot {new Date(payload.generatedAt).toLocaleString()} · Soins signals {g.residenceActivityCount} / 30d
        </p>
      </div>
    </div>
  );
}
