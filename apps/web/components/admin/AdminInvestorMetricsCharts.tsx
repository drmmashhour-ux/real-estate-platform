"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type InvestorSnapshotChartRow = {
  date: string;
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  bookings: number;
  revenue: number;
  conversionPct: number;
};

export function AdminInvestorMetricsCharts({ data }: { data: InvestorSnapshotChartRow[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">
        No snapshots yet. Run the daily cron or call{" "}
        <code className="text-slate-400">captureAndStoreMetricSnapshot</code> once migrations are applied.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">User growth</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">Total users vs active (30d touch) per snapshot day</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #3f3f46" }} />
              <Legend />
              <Line type="monotone" dataKey="totalUsers" stroke="#34d399" dot={false} strokeWidth={2} name="Total users" />
              <Line type="monotone" dataKey="activeUsers" stroke="#22d3ee" dot={false} strokeWidth={2} name="Active (30d)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue trend</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">Sum of revenue events in rolling 30d window (per snapshot)</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #3f3f46" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f472b6" dot={false} strokeWidth={2} name="Revenue (30d)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bookings trend</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">Confirmed / completed stays (30d window)</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #3f3f46" }} />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#fbbf24" dot={false} strokeWidth={2} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listings scale</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">BNHUB published + FSBO active at snapshot</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #3f3f46" }} />
              <Legend />
              <Line type="monotone" dataKey="totalListings" stroke="#a78bfa" dot={false} strokeWidth={2} name="Listings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion rate</h3>
        <p className="mt-0.5 text-[11px] text-slate-600">Won ÷ (won + lost) leads, 30d window</p>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#09090b", border: "1px solid #3f3f46" }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "Conversion"]}
              />
              <Line type="monotone" dataKey="conversionPct" stroke="#38bdf8" dot={false} strokeWidth={2} name="Conversion %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
