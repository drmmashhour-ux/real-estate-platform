"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestorMetricsPayload } from "@/modules/investor/investor-metrics";

const GOLD = "var(--color-premium-gold)";

export function InvestorDashboardCharts({ data }: { data: InvestorMetricsPayload }) {
  const combo = data.listingsGrowth.map((row, i) => ({
    date: row.date,
    listings: row.value,
    transactions: data.transactionsOverTime[i]?.value ?? 0,
    users: data.usersGrowth[i]?.value ?? 0,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Listings growth</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.listingsGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.15} name="New listings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transactions & users (daily)</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Legend />
              <Area type="monotone" dataKey="transactions" stackId="1" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} />
              <Area type="monotone" dataKey="users" stackId="2" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue (CAD, realized)</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.2} name="Revenue (CAD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
