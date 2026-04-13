"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GOLD = "#D4AF37";

export type AnalyticsSeriesPoint = {
  date: string;
  visitors: number;
  listingsBroker: number;
  listingsSelf: number;
  transactionsClosed: number;
};

export type FunnelStage = { label: string; value: number; color: string };

export function AdminAnalyticsCharts(props: {
  series: AnalyticsSeriesPoint[];
  funnel: FunnelStage[];
}) {
  const { series, funnel } = props;
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));

  const chartData = series;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Traffic &amp; supply (30 days)</h2>
        <p className="mt-1 text-sm text-zinc-500">Visitors from analytics rows; listings and closed commerce events by UTC day.</p>
        <div className="mt-4 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12 }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke={GOLD} fillOpacity={1} fill="url(#vis)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Bookings &amp; revenue proxies</h2>
        <p className="mt-1 text-sm text-zinc-500">Daily new listings (broker vs self-serve) and closed booking/payment events.</p>
        <div className="mt-4 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} width={32} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12 }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="listingsBroker" name="Listings (broker)" stackId="lst" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="left" dataKey="listingsSelf" name="Listings (self)" stackId="lst" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactionsClosed"
                name="Closed events"
                stroke={GOLD}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Acquisition funnel (30 days)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Relative scale — use alongside CRM and finance dashboards for revenue truth.
        </p>
        <ul className="mt-6 space-y-4">
          {funnel.map((stage) => (
            <li key={stage.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-300">{stage.label}</span>
                <span className="font-mono text-zinc-500">{stage.value.toLocaleString()}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stage.value / maxFunnel) * 100)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
