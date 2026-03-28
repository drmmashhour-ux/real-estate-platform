"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { PlatformStatsResult } from "@/modules/analytics/services/get-platform-stats";

const GOLD = "var(--color-premium-gold)";

export function AdminHubCharts({ stats }: { stats: PlatformStatsResult | null }) {
  if (!stats || stats.series.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Trends (30 days)</h2>
        <p className="mt-2 text-sm text-slate-500">Not enough analytics data to chart yet.</p>
      </section>
    );
  }

  const data = stats.series.map((p) => ({
    date: p.date.slice(5),
    broker: p.listingsBroker,
    self: p.listingsSelf,
    closed: p.transactionsClosed,
  }));

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-premium-gold/20 bg-[#0a0a0a] p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Listings growth</h2>
        <p className="mt-1 text-xs text-slate-500">New broker vs self-serve listings per day</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgb(var(--premium-gold-channels) / 0.3)", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Line type="monotone" dataKey="broker" name="Broker" stroke={GOLD} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="self" name="Self-serve" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-premium-gold/20 bg-[#0a0a0a] p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Booking signals</h2>
        <p className="mt-1 text-xs text-slate-500">Closed transaction signals per day</p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgb(var(--premium-gold-channels) / 0.3)", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey="closed" name="Closed signals" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
