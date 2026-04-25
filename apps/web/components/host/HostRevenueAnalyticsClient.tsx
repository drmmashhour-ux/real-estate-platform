"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import type { HostRevenueInsight, HostRevenueMetrics } from "@/modules/host-analytics/host-analytics.types";

type Granularity = "daily" | "weekly" | "monthly";

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help text-slate-500" title={text}>
      ⓘ
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2 text-[11px] font-normal leading-snug text-slate-300 shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  );
}

function formatCad(cents: number): string {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function HostRevenueAnalyticsClient({
  initialListingOptions = [],
}: {
  initialListingOptions?: { id: string; title: string; listingCode: string }[];
}) {
  const [days, setDays] = useState(90);
  const [listingId, setListingId] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<HostRevenueMetrics | null>(null);
  const [insights, setInsights] = useState<HostRevenueInsight[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({ days: String(days) });
      if (listingId.trim()) q.set("listingId", listingId.trim());
      const res = await fetch(`/api/bnhub/host/revenue-analytics?${q}`, { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as {
        metrics?: HostRevenueMetrics;
        insights?: HostRevenueInsight[];
        error?: string;
      };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Failed to load analytics");
      setMetrics(j.metrics ?? null);
      setInsights(j.insights ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setMetrics(null);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [days, listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const series = metrics?.series[granularity] ?? [];
  const chartData = useMemo(
    () =>
      series.map((d) => ({
        ...d,
        revenueDollars: Math.round(d.revenueCents / 100),
      })),
    [series],
  );

  const exportCsv = () => {
    const q = new URLSearchParams({ days: String(days), format: "csv" });
    if (listingId.trim()) q.set("listingId", listingId.trim());
    window.open(`/api/bnhub/host/revenue-analytics?${q}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Revenue intelligence</h1>
          <p className="mt-1 text-sm text-slate-400">
            BNHub — metrics from confirmed and completed bookings only. No forward-looking projections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/host"
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            ← Host hub
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-emerald-600/50 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <label className="text-sm">
          <span className="block text-xs font-medium text-slate-500">Range</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
            <option value={365}>Last 365 days</option>
          </select>
        </label>
        {initialListingOptions.length > 0 ? (
          <label className="text-sm">
            <span className="block text-xs font-medium text-slate-500">Listing</span>
            <select
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
            >
              <option value="">All listings</option>
              {initialListingOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.listingCode})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm">
          <span className="block text-xs font-medium text-slate-500">Chart bucket</span>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{err}</p>
      ) : null}

      {loading && !metrics ? (
        <p className="text-sm text-slate-500">Loading analytics…</p>
      ) : null}

      {metrics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total revenue
                <InfoHint text={metrics.metricExplanations.totalRevenue ?? ""} />
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCad(metrics.totalRevenueCents)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Occupancy
                <InfoHint text={metrics.metricExplanations.occupancy ?? ""} />
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {metrics.occupancyRate != null ? `${(metrics.occupancyRate * 100).toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.occupiedNights} occupied / {metrics.availableNights} available nights
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Avg nightly (host)
                <InfoHint text={metrics.metricExplanations.avgNightlyRate ?? ""} />
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {metrics.avgNightlyRateCents != null ? formatCad(metrics.avgNightlyRateCents) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Inquiry → booking
                <InfoHint text={metrics.metricExplanations.bookingConversion ?? ""} />
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {metrics.bookingConversionRate != null
                  ? `${(metrics.bookingConversionRate * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cancellation rate
                <InfoHint text={metrics.metricExplanations.cancellation ?? ""} />
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {metrics.cancellationRate != null ? `${(metrics.cancellationRate * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Listings in scope</p>
              <p className="mt-2 text-2xl font-semibold text-white">{metrics.listingCount}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Revenue breakdown (allocated to window)</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">
                  Base (nightly) <InfoHint text={metrics.metricExplanations.baseRevenue ?? ""} />
                </dt>
                <dd className="text-lg font-medium text-white">{formatCad(metrics.breakdown.baseNightlyCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  Cleaning <InfoHint text={metrics.metricExplanations.cleaning ?? ""} />
                </dt>
                <dd className="text-lg font-medium text-white">{formatCad(metrics.breakdown.cleaningCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  Guest service fees <InfoHint text={metrics.metricExplanations.serviceFees ?? ""} />
                </dt>
                <dd className="text-lg font-medium text-white">{formatCad(metrics.breakdown.guestServiceFeeCents)}</dd>
              </div>
            </dl>
          </section>

          {insights.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">Insights</h2>
              <ul className="space-y-2">
                {insights.map((i) => (
                  <li
                    key={i.id}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      i.severity === "opportunity"
                        ? "border-amber-500/40 bg-amber-950/30 text-amber-100"
                        : i.severity === "watch"
                          ? "border-rose-500/35 bg-rose-950/25 text-rose-100"
                          : "border-slate-700 bg-slate-900/60 text-slate-200"
                    }`}
                  >
                    <p className="font-medium">{i.title}</p>
                    <p className="mt-1 text-xs opacity-90">{i.detail}</p>
                    <p className="mt-2 font-mono text-[10px] text-slate-500">{i.basis}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-1">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-sm font-semibold text-slate-200">Revenue ({granularity})</h2>
              <div className="mt-4 h-72 w-full">
                {chartData.length === 0 ? (
                  <p className="text-sm text-slate-500">No booked nights in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                        formatter={(v: number) => [`$${v} CAD`, "Revenue"]}
                      />
                      <Legend />
                      <Bar dataKey="revenueDollars" name="Revenue (CAD)" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-sm font-semibold text-slate-200">Occupied nights ({granularity})</h2>
              <div className="mt-4 h-72 w-full">
                {chartData.length === 0 ? (
                  <p className="text-sm text-slate-500">No occupied nights in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="occupiedNights"
                        name="Occupied nights"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          {metrics.listingBreakdown.length > 1 ? (
            <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-sm font-semibold text-slate-200">Listing comparison</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Listing</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2 pr-4">Occupancy</th>
                      <th className="py-2 pr-4">ADR</th>
                      <th className="py-2">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.listingBreakdown.map((r) => (
                      <tr key={r.listingId} className="border-b border-slate-800/80">
                        <td className="py-2 pr-4 text-slate-200">
                          <span className="font-medium">{r.title}</span>
                          <span className="ml-2 font-mono text-xs text-slate-500">{r.listingCode}</span>
                        </td>
                        <td className="py-2 pr-4 text-emerald-200">{formatCad(r.revenueCents)}</td>
                        <td className="py-2 pr-4 text-slate-300">
                          {r.occupancyRate != null ? `${(r.occupancyRate * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 pr-4 text-slate-300">
                          {r.avgNightlyRateCents != null ? formatCad(r.avgNightlyRateCents) : "—"}
                        </td>
                        <td className="py-2 text-slate-400">{r.bookingCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
