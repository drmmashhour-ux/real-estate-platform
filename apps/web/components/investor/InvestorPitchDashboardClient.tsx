"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";
import type { InvestorPitchDashboardVm } from "@/modules/investor/investor-pitch.types";

import { InvestorDemoWalkthrough } from "./investor-demo-mode";

const GOLD = "#D4AF37";

function fmtCad(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-CA").format(n);
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] p-5 transition hover:border-[#D4AF37]/35">
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">{title}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-[#D4AF37]">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-white/40">{subtitle}</p> : null}
    </div>
  );
}

export default function InvestorPitchDashboardClient({
  initialVm,
  allowLiveMetrics,
  demoPresentationMode,
}: {
  initialVm: InvestorPitchDashboardVm;
  allowLiveMetrics: boolean;
  demoPresentationMode: boolean;
}) {
  const [vm, setVm] = useState(initialVm);
  const [loading, setLoading] = useState(false);
  const [growthHorizon, setGrowthHorizon] = useState<"daily" | "weekly">("daily");
  const [useLive, setUseLive] = useState(!initialVm.sampleMode);

  const refresh = useCallback(
    async (nextLive: boolean) => {
      setLoading(true);
      try {
        const url =
          allowLiveMetrics && nextLive ? "/api/investor/pitch-dashboard" : "/api/investor/pitch-dashboard?sample=1";
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) throw new Error("Failed to load");
        const data = (await r.json()) as InvestorPitchDashboardVm;
        setVm(data);
        setUseLive(nextLive);
      } finally {
        setLoading(false);
      }
    },
    [allowLiveMetrics],
  );

  const hubChartData = useMemo(
    () =>
      (Object.entries(vm.revenueByHub) as [string, number][]).map(([name, value]) => ({
        name,
        value,
      })),
    [vm.revenueByHub],
  );

  const growthSeries = growthHorizon === "daily" ? vm.growthDaily : vm.growthWeekly;
  const growthChart = useMemo(
    () =>
      growthSeries.map((d) => ({
        t: d.date.slice(5),
        users: d.totalUsers,
        listings: d.totalListings,
        bookings: d.bookings,
        revenue: d.revenue,
      })),
    [growthSeries],
  );

  const fullHubHref = `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/investor`;
  const exportQs = vm.sampleMode ? "?sample=1&" : "?";

  return (
    <div className="min-h-screen bg-black text-white">
      <InvestorDemoWalkthrough enabled={demoPresentationMode} />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-white/[0.06] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/90">LECIPM</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Investor pitch
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/55">
              High-growth platform narrative — metrics, revenue mix, and exportable diligence artifacts.
            </p>
            <p className="mt-2 text-xs text-white/35">
              Generated {new Date(vm.generatedAt).toLocaleString()}
              {vm.sampleMode ? (
                <span className="ml-2 rounded border border-[#D4AF37]/40 px-2 py-0.5 text-[#D4AF37]">
                  Sample data
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {allowLiveMetrics ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  className="accent-[#D4AF37]"
                  checked={!vm.sampleMode}
                  disabled={loading}
                  onChange={(e) => void refresh(e.target.checked)}
                />
                Live metrics
              </label>
            ) : (
              <span className="text-xs text-white/45">Sign in with platform access for live metrics.</span>
            )}
            <Link
              href={fullHubHref}
              className="text-sm text-[#D4AF37] underline-offset-4 transition hover:underline"
            >
              Full investor workspace
            </Link>
          </div>
        </header>

        <section id="pitch-overview" className="scroll-mt-24 space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-white">Platform overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Multi-hub</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {vm.overview.multiHub.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">AI layer</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {vm.overview.aiLayer.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Growth engine</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {vm.overview.growthEngine.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pitch-market" className="scroll-mt-24 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-white">Market position</h2>
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0a0a0a] to-black p-8">
            <ul className="space-y-3 text-lg text-white/75">
              {vm.marketPosition.map((line) => (
                <li key={line} className="max-w-3xl leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pitch-metrics" className="scroll-mt-24 space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-white">Live metrics</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <MetricCard title="Total users" value={fmtNum(vm.liveMetrics.totalUsers)} />
            <MetricCard title="Listings" value={fmtNum(vm.liveMetrics.totalListings)} />
            <MetricCard title="Bookings (30d)" value={fmtNum(vm.liveMetrics.bookings30d)} />
            <MetricCard title="Leads (30d)" value={fmtNum(vm.liveMetrics.leads30dApprox)} subtitle="CRM rows created" />
            <MetricCard title="Revenue (30d)" value={fmtCad(vm.liveMetrics.revenue30dApprox)} subtitle="Approx · see finance" />
          </div>
          {vm.acquisitionSnapshot ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] px-5 py-4 text-sm text-white/65">
              <span className="text-[#D4AF37]">Acquisition · </span>
              {vm.acquisitionSnapshot.totalContacts} contacts tracked · conversion by segment in export JSON.
            </div>
          ) : null}
        </section>

        <section id="pitch-revenue" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-serif text-2xl font-semibold text-white">Revenue by hub</h2>
            <p className="max-w-xl text-xs text-white/45">{vm.revenueByHubDisclaimer}</p>
          </div>
          <div className="h-72 rounded-2xl border border-white/[0.07] bg-[#080808] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hubChartData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fill: "#aaa", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "rgba(212,175,55,0.06)" }}
                  contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "12px" }}
                  formatter={(v: number | string) => [fmtCad(Number(v)), "CAD"]}
                />
                <Bar dataKey="value" fill={GOLD} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section id="pitch-growth" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-semibold text-white">Growth</h2>
            <div className="flex rounded-lg border border-white/10 bg-black p-1 text-xs">
              <button
                type="button"
                className={`rounded-md px-4 py-2 font-medium ${growthHorizon === "daily" ? "bg-[#D4AF37] text-black" : "text-white/60"}`}
                onClick={() => setGrowthHorizon("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 font-medium ${growthHorizon === "weekly" ? "bg-[#D4AF37] text-black" : "text-white/60"}`}
                onClick={() => setGrowthHorizon("weekly")}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="h-80 rounded-2xl border border-white/[0.07] bg-[#080808] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="t" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#c4b5fd" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="listings" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section id="pitch-ai" className="scroll-mt-24 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
            <h2 className="font-serif text-xl font-semibold text-[#D4AF37]">AI system — insights</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {vm.aiHighlights.map((x) => (
                <li key={x} className="leading-relaxed">
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
            <h2 className="font-serif text-xl font-semibold text-[#D4AF37]">Growth engine actions</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {vm.growthActions.map((x) => (
                <li key={x} className="leading-relaxed">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pitch-story" className="scroll-mt-24 space-y-6">
          <h2 className="font-serif text-2xl font-semibold text-white">Story engine</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {vm.narrativeBlocks.map((b) => (
              <article key={b.key} className="rounded-2xl border border-white/[0.07] bg-[#080808] p-6">
                <h3 className="text-lg font-semibold text-[#D4AF37]">{b.title}</h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/65">
                  {b.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-slides" className="scroll-mt-24 space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-white">10-slide deck outline</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {vm.slides.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-5 transition hover:border-[#D4AF37]/25"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Slide {s.index}
                </p>
                <p className="mt-1 font-semibold text-white">{s.title}</p>
                <ul className="mt-3 space-y-1 text-xs text-white/55">
                  {s.bullets.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="pitch-export" className="scroll-mt-24 space-y-6 border-t border-white/[0.06] pt-12">
          <h2 className="font-serif text-2xl font-semibold text-white">Exports</h2>
          <p className="max-w-2xl text-sm text-white/55">
            Investor-ready artifacts mirror on-screen data. PDF includes slide bullets plus appendix KPIs.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#c9a532]"
              href={`/api/investor/pitch-export${exportQs}kind=pitch_pdf`}
            >
              Download pitch PDF
            </a>
            <a
              className="rounded-lg border border-[#D4AF37]/50 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
              href={`/api/investor/pitch-export${exportQs}kind=summary_report`}
            >
              Summary report (.md)
            </a>
            <a
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white/85 hover:border-[#D4AF37]/40"
              href={`/api/investor/pitch-export${exportQs}kind=financial_snapshot`}
            >
              Financial snapshot (.json)
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
