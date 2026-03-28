"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Daily = {
  date: string;
  visitors: number;
  listingsBroker: number;
  listingsSelf: number;
  transactionsClosed: number;
};

type Payload = {
  days: number;
  series: Daily[];
  totals: {
    visitors: number;
    listingsBroker: number;
    listingsSelf: number;
    transactionsClosed: number;
    listingsTotal: number;
  };
};

const GOLD = "var(--color-premium-gold)";
const GOLD_SOFT = "var(--color-premium-gold)";
const AXIS = "#6b7280";
const GRID = "rgb(var(--premium-gold-channels) / 0.12)";

function SummaryCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-[#111111] to-[#0B0B0B] p-5 shadow-lg shadow-black/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {subtitle ? <p className="mt-2 text-xs text-[#B3B3B3]">{subtitle}</p> : null}
    </div>
  );
}

function formatTick(isoDay: string) {
  const [, m, d] = isoDay.split("-");
  return `${m}/${d}`;
}

export type PlatformRange = 1 | 7 | 30;

export function PlatformAnalyticsDashboard() {
  const [range, setRange] = useState<PlatformRange>(7);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/platform-analytics?days=${range}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as Payload & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load platform analytics");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      void load();
    }, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((row) => ({
      ...row,
      label: formatTick(row.date),
    }));
  }, [data]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Platform metrics</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Traffic, listings &amp; closed deals</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#B3B3B3]">
            Visitors from sitewide beacons; listings split broker vs self-serve; transactions = unique BNHub bookings
            confirmed or paid (deduped).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { k: 1 as const, label: "Today" },
              { k: 7 as const, label: "7 days" },
              { k: 30 as const, label: "30 days" },
            ] as const
          ).map(({ k, label }) => (
            <button
              key={k}
              type="button"
              onClick={() => setRange(k)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                range === k
                  ? "bg-premium-gold text-black shadow-lg shadow-premium-gold/30"
                  : "border border-white/15 bg-black/40 text-premium-gold hover:border-premium-gold/50"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-premium-gold/40 px-4 py-2 text-sm font-medium text-premium-gold transition hover:bg-premium-gold/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{err}</div>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-[#B3B3B3]">Loading metrics…</p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total visitors" value={data.totals.visitors.toLocaleString()} subtitle="Page navigations (UTC day)" />
            <SummaryCard
              title="Total listings"
              value={data.totals.listingsTotal.toLocaleString()}
              subtitle={`Broker ${data.totals.listingsBroker.toLocaleString()} · Self ${data.totals.listingsSelf.toLocaleString()}`}
            />
            <SummaryCard title="Broker listings" value={data.totals.listingsBroker.toLocaleString()} subtitle="CRM + BNHub broker authority" />
            <SummaryCard
              title="Closed transactions"
              value={data.totals.transactionsClosed.toLocaleString()}
              subtitle="Confirmed bookings ∪ completed payments"
            />
          </div>

          <section className="rounded-2xl border border-premium-gold/20 bg-[#0B0B0B] p-4 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-premium-gold">Visitors over time</h3>
            <div className="mt-4 h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 6" />
                  <XAxis dataKey="label" stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgb(var(--premium-gold-channels) / 0.35)",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: GOLD_SOFT }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="visitors" name="Visitors" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-premium-gold/20 bg-[#0B0B0B] p-4 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-premium-gold">New listings by channel</h3>
              <p className="mt-1 text-xs text-[#888]">Broker vs self-listed (per day)</p>
              <div className="mt-4 h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" />
                    <XAxis dataKey="label" stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgb(var(--premium-gold-channels) / 0.35)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="listingsBroker" name="Broker" fill={GOLD} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="listingsSelf" name="Self-listed" fill={GOLD_SOFT} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-premium-gold/20 bg-[#0B0B0B] p-4 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-premium-gold">Closed transactions</h3>
              <p className="mt-1 text-xs text-[#888]">Unique bookings (deduped) per UTC day</p>
              <div className="mt-4 h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" />
                    <XAxis dataKey="label" stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis stroke={AXIS} tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgb(var(--premium-gold-channels) / 0.35)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="transactionsClosed" name="Closed" fill="#b8860b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
