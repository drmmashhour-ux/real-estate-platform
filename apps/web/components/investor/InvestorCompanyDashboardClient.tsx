"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

type KpiPanel = {
  asOf: string;
  kpis: {
    mrrUsd: number | null;
    arrUsd: number | null;
    totalLeadsAllTime: number;
    leadsLast30d: number;
    costPerLeadUsd: number | null;
    revenuePerLeadUsd: number | null;
    conversionRateOverall: number;
    activeOperators: number;
    activeCities: number;
    revenueLast30dUsd: number;
  };
  marketplaceHealth: {
    supplyDemandRatio: number | null;
    avgResponseTimeHours: number | null;
    operatorPerformanceScore: number | null;
    leadQualityDistribution: Array<{ band: string; count: number }>;
  };
  unitEconomics: {
    cacUsd: number | null;
    ltvUsd: number | null;
    ltvToCac: number | null;
    assumptions: string[];
  };
  cityPerformance: Array<{
    city: string;
    country: string;
    leads: number;
    conversions: number;
    revenueUsd: number;
    readinessScore: number | null;
  }>;
  insights: Array<{ kind: string; text: string }>;
};

type GrowthPayload = {
  series: Array<{ date: string; revenueUsd: number; leads: number; conversions: number }>;
};

type ValuationPayload = {
  valuation: {
    arrUsd: number;
    multiplier: number;
    valuationUsd: number;
    adjustments: Array<{ label: string; delta: number }>;
  };
  drivers: {
    monthlyGrowthRate: number;
    retentionRate: number;
    conversionRate: number;
    expansionProgress: number;
  };
};

function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 0 : 2 })}`;
}

export function InvestorCompanyDashboardClient(props: { locale: string; country: string }) {
  const base = `/${props.locale}/${props.country}/dashboard`;
  const [panel, setPanel] = useState<KpiPanel | null>(null);
  const [growth, setGrowth] = useState<GrowthPayload | null>(null);
  const [valuation, setValuation] = useState<ValuationPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [kp, gr, vl] = await Promise.all([
        fetch("/api/investor/kpis", { credentials: "same-origin" }),
        fetch("/api/investor/growth?days=90", { credentials: "same-origin" }),
        fetch("/api/investor/valuation", { credentials: "same-origin" }),
      ]);
      if (!kp.ok || !gr.ok || !vl.ok) {
        const j = await kp.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to load investor metrics");
      }
      setPanel((await kp.json()) as KpiPanel);
      setGrowth((await gr.json()) as GrowthPayload);
      setValuation((await vl.json()) as ValuationPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  const chartData =
    growth?.series.map((p) => ({
      ...p,
      conversionsScaled: p.conversions * (growth.series.reduce((m, x) => Math.max(m, x.leads), 1) > 40 ? 5 : 15),
    })) ?? [];

  return (
    <section className="space-y-8 rounded-2xl border border-premium-gold/25 bg-[#0a0a0c]/95 p-6 shadow-xl shadow-black/40">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Investor relations</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Company cockpit</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Live KPIs refresh every 45s. Figures combine CRM + Senior Living signals with ledger revenue events — reconcile
            with finance before sharing externally.
          </p>
          {panel ?
            <p className="mt-2 font-mono text-[11px] text-slate-500">Snapshot: {new Date(panel.asOf).toLocaleString()}</p>
          : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            Refresh now
          </button>
          <Link
            href="/api/investor/report/monthly"
            prefetch={false}
            className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-black hover:opacity-95"
          >
            Monthly report (.md)
          </Link>
          <Link
            href="/api/investor/report/pdf"
            prefetch={false}
            className="rounded-xl border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
          >
            Investor PDF
          </Link>
          <Link href={`${base}/investor/platform`} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
            Legacy traction page
          </Link>
        </div>
      </header>

      {err ?
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{err}</div>
      : null}

      {valuation ?
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-400/90">Indicative valuation</p>
            <p className="mt-3 font-mono text-3xl text-white">{fmtUsd(valuation.valuation.valuationUsd)}</p>
            <p className="mt-2 text-xs text-slate-400">
              {valuation.valuation.multiplier}x · ARR basis {fmtUsd(valuation.valuation.arrUsd)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Multiplier drivers</p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <li>
                MoM revenue velocity: {(valuation.drivers.monthlyGrowthRate * 100).toFixed(1)}%
              </li>
              <li>Retention proxy: {(valuation.drivers.retentionRate * 100).toFixed(1)}%</li>
              <li>Conversion: {(valuation.drivers.conversionRate * 100).toFixed(1)}%</li>
              <li>Expansion progress: {(valuation.drivers.expansionProgress * 100).toFixed(0)}%</li>
            </ul>
          </div>
        </div>
      : null}

      {panel ?
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="MRR (est.)" value={fmtUsd(panel.kpis.mrrUsd)} />
          <MetricTile label="ARR (est.)" value={fmtUsd(panel.kpis.arrUsd)} />
          <MetricTile label="Revenue (30d)" value={fmtUsd(panel.kpis.revenueLast30dUsd)} />
          <MetricTile label="Total leads" value={panel.kpis.totalLeadsAllTime.toLocaleString()} />
          <MetricTile label="Leads (30d)" value={panel.kpis.leadsLast30d.toLocaleString()} />
          <MetricTile label="Cost / lead" value={fmtUsd(panel.kpis.costPerLeadUsd)} />
          <MetricTile label="Revenue / lead" value={fmtUsd(panel.kpis.revenuePerLeadUsd)} />
          <MetricTile label="Conversion (proxy)" value={`${(panel.kpis.conversionRateOverall * 100).toFixed(1)}%`} />
          <MetricTile label="Active operators" value={String(panel.kpis.activeOperators)} />
          <MetricTile label="Active cities" value={String(panel.kpis.activeCities)} />
        </div>
      : (
        <p className="text-sm text-slate-500">Loading KPIs…</p>
      )}

      {panel ?
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Marketplace health</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">Supply / demand</span>
                <span className="font-mono text-premium-gold">
                  {panel.marketplaceHealth.supplyDemandRatio?.toFixed(2) ?? "—"}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">Avg response (h)</span>
                <span className="font-mono text-premium-gold">
                  {panel.marketplaceHealth.avgResponseTimeHours?.toFixed(2) ?? "—"}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">Operator score</span>
                <span className="font-mono text-premium-gold">
                  {panel.marketplaceHealth.operatorPerformanceScore?.toFixed(1) ?? "—"}
                </span>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-slate-500">Lead quality (Senior AI bands, 30d)</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {panel.marketplaceHealth.leadQualityDistribution.length === 0 ?
                  <li>No scored senior leads in window.</li>
                : panel.marketplaceHealth.leadQualityDistribution.map((b) => (
                    <li key={b.band} className="flex justify-between">
                      <span>{b.band}</span>
                      <span className="font-mono">{b.count}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Unit economics</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">CAC</span>
                <span className="font-mono text-premium-gold">{fmtUsd(panel.unitEconomics.cacUsd)}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">LTV (model)</span>
                <span className="font-mono text-premium-gold">{fmtUsd(panel.unitEconomics.ltvUsd)}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-slate-500">LTV / CAC</span>
                <span className="font-mono text-premium-gold">
                  {panel.unitEconomics.ltvToCac?.toFixed(2) ?? "—"}
                </span>
              </li>
            </ul>
            <ul className="mt-6 space-y-1 text-[11px] leading-relaxed text-slate-600">
              {panel.unitEconomics.assumptions.map((a) => (
                <li key={a.slice(0, 40)}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      : null}

      {panel ?
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white">Signals</h3>
          <ul className="mt-4 space-y-2">
            {panel.insights.map((i, idx) => (
              <li
                key={idx}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  i.kind === "positive"
                    ? "border-emerald-500/30 bg-emerald-950/25 text-emerald-100"
                  : i.kind === "opportunity"
                    ? "border-amber-500/30 bg-amber-950/20 text-amber-100"
                    : "border-white/10 bg-black/30 text-slate-300"
                }`}
              >
                {i.text}
              </li>
            ))}
          </ul>
        </div>
      : null}

      {chartData.length > 0 ?
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white">Growth (90d daily)</h3>
          <p className="mt-1 text-xs text-slate-500">Revenue (USD), leads, and conversions — dual axes.</p>
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} minTickGap={28} />
                <YAxis yAxisId="left" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #333" }}
                  labelStyle={{ color: "#ccc" }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenueUsd" name="Revenue USD" stroke="#d4af37" dot={false} strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke="#a78bfa" dot={false} strokeWidth={1.2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      : (
        <p className="text-center text-sm text-slate-500">{growth ? "No growth points." : "Loading charts…"}</p>
      )}

      {panel?.cityPerformance.length ?
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <h3 className="p-5 pb-0 text-sm font-semibold text-white">City performance (Senior expansion)</h3>
          <table className="mt-2 w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-white/10 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Leads (90d)</th>
                <th className="px-4 py-3 font-medium">Conversions</th>
                <th className="px-4 py-3 font-medium">Rev. (proxy)</th>
                <th className="px-4 py-3 font-medium">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {panel.cityPerformance.map((row) => (
                <tr key={`${row.city}-${row.country}`} className="border-b border-white/5 text-slate-300">
                  <td className="px-4 py-2.5 font-medium text-white">
                    {row.city}
                    <span className="ml-2 text-[10px] text-slate-500">{row.country}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{row.leads}</td>
                  <td className="px-4 py-2.5 font-mono">{row.conversions}</td>
                  <td className="px-4 py-2.5 font-mono">{fmtUsd(row.revenueUsd)}</td>
                  <td className="px-4 py-2.5 font-mono">
                    {row.readinessScore != null ? row.readinessScore.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      : null}

      <p className="text-center text-[11px] text-slate-600">
        Internal use — align with audited financials and data protection policy before investor distribution.
      </p>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-xl text-white">{value}</p>
    </div>
  );
}
