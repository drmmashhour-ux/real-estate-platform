"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UnifiedAnalyticsPayload, UnifiedAnalyticsRangePreset } from "@/modules/analytics/unified-analytics/unified-analytics.types";

const PRESETS: { id: UnifiedAnalyticsRangePreset; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

function fmtCad(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(cents / 100);
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

export function AnalyticsDashboardClient({
  initialView,
}: {
  initialView: UnifiedAnalyticsPayload["view"];
}) {
  const [preset, setPreset] = useState<UnifiedAnalyticsRangePreset>("30d");
  const [data, setData] = useState<UnifiedAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/analytics?range=${encodeURIComponent(preset)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Could not load analytics");
        setData(null);
        return;
      }
      const j = (await res.json()) as UnifiedAnalyticsPayload;
      setData(j);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    window.open(`/api/dashboard/analytics/export?range=${encodeURIComponent(preset)}&format=csv`, "_blank");
  }

  function printPdf() {
    window.print();
  }

  const investorLite = initialView === "investor";

  const chartRev =
    data?.revenueSeries.map((p) => ({
      date: p.date.slice(5),
      revenue: Math.round(p.value / 100),
    })) ?? [];

  const chartLeads =
    data?.leadSeries.map((p) => ({
      date: p.date.slice(5),
      leads: p.value,
    })) ?? [];

  const funnelData =
    data?.funnel.slice(0, 6).map((f) => ({
      name: f.label.slice(0, 18),
      count: f.count,
    })) ?? [];

  return (
    <div className="min-h-screen bg-[#070707] px-4 py-8 text-slate-100 print:bg-white print:text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 print:border-slate-300">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">LECIPM Intelligence</p>
              <h1 className="mt-1 text-3xl font-semibold text-white print:text-black">Analytics</h1>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">
                Revenue, growth, funnel, and forecasts — role-scoped.
                {data ? ` Updated ${new Date(data.generatedAt).toLocaleString()}` : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  disabled={loading}
                  className={`min-h-[48px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    preset === p.id ?
                      "bg-amber-500 text-black"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:border-amber-500/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={exportCsv}
                className="min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-500/40 print:hidden"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={printPdf}
                className="min-h-[48px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-500/40 print:hidden"
              >
                Print / PDF
              </button>
            </div>
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </header>

        {loading || !data ?
          <p className="text-slate-400">{loading ? "Loading metrics…" : "No data."}</p>
        : <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Revenue (window)" value={fmtCad(data.kpis.revenueCents)} hint="Paid platform totals" />
              <KpiCard title="Leads" value={data.kpis.leadsGenerated} hint="Captured in range" />
              <KpiCard title="Conversion" value={pct(data.kpis.conversionRate)} hint="Won / leads (CRM stages)" />
              {investorLite ?
                <KpiCard title="Lead quality (avg)" value={data.kpis.leadQualityScore ?? "—"} hint="Score 0–100" />
              : <KpiCard title="Active users" value={data.kpis.activeUsers} hint="Touched window" />}
            </section>

            {!investorLite ?
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total users" value={data.kpis.totalUsers} hint="Registered" />
                <KpiCard title="Rev / lead" value={data.kpis.revenuePerLeadCents != null ? fmtCad(data.kpis.revenuePerLeadCents) : "—"} />
                <KpiCard title="LTV (proxy)" value={data.kpis.ltvCents != null ? fmtCad(data.kpis.ltvCents) : "—"} hint="Paid ÷ payers" />
                <KpiCard title="CAC" value={data.kpis.cacCents != null ? fmtCad(data.kpis.cacCents) : "—"} hint="Needs ANALYTICS_MARKETING_SPEND_CENTS" />
              </section>
            : null}

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue (CAD)" subtitle="Daily gross paid volume">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartRev}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="#f59e0b33" name="CAD" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Leads per day" subtitle="Demand curve">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartLeads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                    <Area type="monotone" dataKey="leads" stroke="#34d399" fill="#34d39933" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Product funnel (events)" subtitle="Anonymous funnel beacons">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} interval={0} angle={-18} textAnchor="end" height={70} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                    <Bar dataKey="count" fill="#6366f1aa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold text-white print:text-black">Forecast & momentum</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-300 print:text-slate-700">
                  <li>
                    <span className="text-slate-500">30d revenue outlook · </span>
                    <span className="font-medium text-white print:text-black">{fmtCad(data.forecast.revenueNext30DaysCents)}</span>
                  </li>
                  <li>
                    <span className="text-slate-500">Growth trend · </span>
                    <span className="font-medium text-emerald-300">{data.forecast.growthTrendPct}%</span>
                  </li>
                  <li>
                    <span className="text-slate-500">Demand spike risk · </span>
                    <span className="font-medium capitalize text-amber-200">{data.forecast.demandSpikeRisk}</span>
                  </li>
                </ul>

                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts</h3>
                <ul className="mt-2 space-y-2">
                  {data.alerts.length === 0 ?
                    <li className="text-sm text-slate-500">No automated alerts for this window.</li>
                  : data.alerts.map((a) => (
                      <li key={a.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
                        <span className="font-medium text-amber-200">{a.title}</span>
                        <span className="mt-1 block text-slate-400">{a.detail}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
              <h2 className="text-lg font-semibold text-white print:text-black">Insights</h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {data.insights.map((i) => (
                  <li key={i.id} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200">
                    {i.text}
                  </li>
                ))}
              </ul>
              {data.notes.length > 0 ?
                <ul className="mt-6 space-y-1 text-xs text-slate-500">
                  {data.notes.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              : null}
            </section>
          </>
        }
      </div>
    </div>
  );
}

function KpiCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500/90">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white print:text-black">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white print:text-black">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
