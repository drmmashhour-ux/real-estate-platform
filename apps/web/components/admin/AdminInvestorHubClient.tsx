"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AdminInvestorFunnelChart } from "@/components/admin/AdminInvestorFunnelChart";
import { AdminInvestorMetricsCharts, type InvestorSnapshotChartRow } from "@/components/admin/AdminInvestorMetricsCharts";
import { AdminInvestorQAPanel } from "@/components/admin/AdminInvestorQAPanel";
import type { InvestorPlatformFunnel } from "@/src/modules/investor-metrics/investorFunnel";
import type { FinancialProjections } from "@/src/modules/investor-metrics/investorProjections";

export type AdminInvestorHubData = {
  chartData: InvestorSnapshotChartRow[];
  display: {
    totalUsers: number;
    activeUsers: number;
    totalListings: number;
    bookings: number;
    revenue: number;
    conversionRate: number;
    dateLabel: string;
  };
  kpis: {
    activeUsersPct: number;
    bookingRate: number;
    revenuePerUser: number;
    cac: number | null;
  };
  marketplace: {
    buyerPersonaUsers: number;
    buyersToListingsRatio: number;
    supplyDemandIndex: number;
    brokerResponseRate: number;
    brokerResponseSampleSize: number;
  };
  pitchDeck: {
    title: string;
    createdAtLabel: string;
    slides: Array<{ order: number; type: string; title: string; content: unknown }>;
  } | null;
  funnel: InvestorPlatformFunnel;
  projections: FinancialProjections;
};

type TabId = "overview" | "metrics" | "funnel" | "financials" | "pitch" | "qa";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "funnel", label: "Funnel" },
  { id: "financials", label: "Financials" },
  { id: "pitch", label: "Pitch content" },
  { id: "qa", label: "Q&A" },
];

function contentToText(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

function buildPitchMarkdown(deck: NonNullable<AdminInvestorHubData["pitchDeck"]>): string {
  let md = `# ${deck.title}\n\n_Generated ${deck.createdAtLabel}_\n\n`;
  for (const s of deck.slides) {
    md += `## Slide ${s.order}: ${s.title}\n`;
    md += `_Type: ${s.type}_\n\n`;
    md += `${contentToText(s.content)}\n\n`;
  }
  return md.trim() + "\n";
}

export function AdminInvestorHubClient({
  data,
  initialTab = "overview",
}: {
  data: AdminInvestorHubData;
  initialTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy:", text);
    }
  }, []);

  const pitchMd = data.pitchDeck ? buildPitchMarkdown(data.pitchDeck) : "";
  const firstSlide = data.pitchDeck?.slides[0];
  const firstBody = firstSlide ? contentToText(firstSlide.content) : "";
  const summaryLine = data.pitchDeck
    ? firstSlide
      ? `${firstSlide.title}: ${firstBody.slice(0, 280)}${firstBody.length > 280 ? "…" : ""}`
      : `${data.pitchDeck.title} — no slides yet.`
    : "No pitch deck in the database yet. Open Pitch deck generator to build slides from live metrics.";

  const growthYoY =
    data.chartData.length >= 2
      ? (() => {
          const first = data.chartData[0];
          const last = data.chartData[data.chartData.length - 1];
          if (!first || !last || first.totalUsers === 0) return null;
          return ((last.totalUsers - first.totalUsers) / first.totalUsers) * 100;
        })()
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-sky-600/30 text-sky-200 ring-1 ring-sky-500/40"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-8">
          <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
            One place for diligence: snapshot KPIs, traffic-to-payment funnel, illustrative projections, pitch copy, and
            Q&amp;A. Export CSVs or a Markdown bundle for print/PDF.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Users</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{data.display.totalUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Bookings (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-amber-300">{data.display.bookings}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Revenue (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-pink-300">{data.display.revenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Growth (users, series)</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-300">
                {growthYoY != null ? `${growthYoY >= 0 ? "+" : ""}${growthYoY.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">First vs last snapshot in chart range</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Visitor sessions (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{data.funnel.visitorSessions}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Listing views (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-teal-300">
                {Math.max(data.funnel.searchListingViews, data.funnel.crmListingViews)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">MoM revenue (proj.)</p>
              <p className="mt-1 text-2xl font-semibold text-rose-300">
                {data.projections.monthOverMonthRevenuePct != null
                  ? `${data.projections.monthOverMonthRevenuePct >= 0 ? "+" : ""}${data.projections.monthOverMonthRevenuePct.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">ARR (illustrative)</p>
              <p className="mt-1 text-2xl font-semibold text-violet-300">
                {data.projections.annualRunRate.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=csv"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-200 hover:bg-amber-500/20"
            >
              Export metrics CSV
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=funnel"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-200 hover:bg-cyan-500/20"
            >
              Funnel CSV
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=projections"
              className="rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-pink-200 hover:bg-pink-500/20"
            >
              Projections CSV
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=report"
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Full report (.txt)
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=pdf"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-200 hover:bg-rose-500/20"
            >
              Full report (PDF)
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=monthly"
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Monthly summary (.txt)
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=monthly-pdf"
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Monthly summary (PDF)
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor-metrics/export?format=chart-json"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-200 hover:bg-emerald-500/20"
            >
              Chart series (JSON)
            </Link>
            <Link
              prefetch={false}
              href="/api/admin/investor/export"
              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-violet-200 hover:bg-violet-500/20"
            >
              Download full bundle (.md)
            </Link>
            <Link
              href="/admin/pitch-deck"
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Pitch deck generator
            </Link>
          </div>
        </div>
      )}

      {tab === "funnel" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white">Visitors → views → bookings → payments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Traffic uses distinct <code className="text-slate-400">session_id</code> on{" "}
              <code className="text-slate-400">page_view</code>; BNHub discovery uses <code className="text-slate-400">SearchEvent</code>{" "}
              VIEW; CRM funnel can add <code className="text-slate-400">AnalyticsFunnelEvent.listing_view</code>. Payments reflect Stripe-completed BNHub charges in the window.
            </p>
          </div>
          <AdminInvestorFunnelChart funnel={data.funnel} />
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">Raw counts ({data.funnel.windowDays}d)</h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
              <li>Page view events (all rows): {data.funnel.pageViewEvents}</li>
              <li>Search listing views: {data.funnel.searchListingViews}</li>
              <li>CRM funnel listing views: {data.funnel.crmListingViews}</li>
              <li>Bookings created: {data.funnel.bookingsCreated}</li>
              <li>Confirmed / completed: {data.funnel.bookingsConfirmedOrCompleted}</li>
              <li>Payments completed: {data.funnel.paymentsCompleted}</li>
              <li>Payment volume (cents): {data.funnel.paymentVolumeCents}</li>
            </ul>
          </div>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white">Key metrics (30d window)</h2>
            <p className="mt-1 text-xs text-slate-500">
              Snapshot date: <span className="font-mono text-slate-400">{data.display.dateLabel}</span>
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Growth — total users</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">{data.display.totalUsers}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Active users (30d)</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-300">{data.display.activeUsers}</p>
                <p className="mt-1 text-xs text-slate-500">{data.kpis.activeUsersPct.toFixed(1)}% of all users</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Bookings (30d)</p>
                <p className="mt-1 text-2xl font-semibold text-amber-300">{data.display.bookings}</p>
                <p className="mt-1 text-xs text-slate-500">Rate vs active: {data.kpis.bookingRate.toFixed(4)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Revenue (30d sum)</p>
                <p className="mt-1 text-2xl font-semibold text-pink-300">{data.display.revenue.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">Per active user: {data.kpis.revenuePerUser.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Conversion (won / won+lost)</p>
                <p className="mt-1 text-2xl font-semibold text-sky-300">{(data.display.conversionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">CAC (basic)</p>
                <p className="mt-1 text-2xl font-semibold text-slate-200">
                  {data.kpis.cac != null ? `$${data.kpis.cac.toFixed(2)}` : "n/a"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Set INVESTOR_MARKETING_SPEND_30D for spend input</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="text-xs uppercase text-slate-500">Live listings</p>
                <p className="mt-1 text-2xl font-semibold text-violet-300">{data.display.totalListings}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Marketplace</h2>
            <p className="mt-1 text-sm text-slate-500">Supply vs demand and broker responsiveness (30d samples).</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-500">Buyer-persona users</p>
                <p className="mt-1 text-xl font-semibold">{data.marketplace.buyerPersonaUsers}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-500">Buyers / listings</p>
                <p className="mt-1 text-xl font-semibold">{data.marketplace.buyersToListingsRatio.toFixed(2)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-500">Supply / demand index</p>
                <p className="mt-1 text-xl font-semibold">{data.marketplace.supplyDemandIndex.toFixed(2)}</p>
                <p className="mt-1 text-[11px] text-slate-500">Listings ÷ (leads + buyer requests, 30d)</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-500">Broker ≤24h response</p>
                <p className="mt-1 text-xl font-semibold">{(data.marketplace.brokerResponseRate * 100).toFixed(1)}%</p>
                <p className="mt-1 text-[11px] text-slate-500">n={data.marketplace.brokerResponseSampleSize} assigned leads</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Trends</h2>
            <p className="mt-1 text-sm text-slate-500">
              Daily snapshot history (up to 90 points): user growth, revenue trend, bookings, conversion. Export the
              same series as{" "}
              <Link prefetch={false} href="/api/admin/investor-metrics/export?format=chart-json" className="text-emerald-400 underline">
                JSON for charts
              </Link>{" "}
              or{" "}
              <Link prefetch={false} href="/api/admin/investor-metrics/export?format=csv" className="text-amber-400/90 underline">
                CSV
              </Link>
              .
            </p>
            <div className="mt-6">
              <AdminInvestorMetricsCharts data={data.chartData} />
            </div>
          </div>
        </div>
      )}

      {tab === "financials" && (
        <div className="space-y-6">
          <p className="text-sm text-slate-400">
            Core metrics use <code className="text-slate-500">revenue_event</code> sums. Projections below are illustrative (not GAAP). Pair with CSV exports for history.
          </p>
          <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-5">
            <h3 className="text-sm font-semibold text-violet-200">Illustrative projections</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
              <li>
                <strong className="text-slate-300">Trailing 30d revenue:</strong>{" "}
                {data.projections.revenueTrailing30d.toFixed(2)}
              </li>
              <li>
                <strong className="text-slate-300">Prior 30d revenue:</strong>{" "}
                {data.projections.revenuePrior30d != null ? data.projections.revenuePrior30d.toFixed(2) : "n/a"}
              </li>
              <li>
                <strong className="text-slate-300">MoM revenue change:</strong>{" "}
                {data.projections.monthOverMonthRevenuePct != null
                  ? `${data.projections.monthOverMonthRevenuePct >= 0 ? "+" : ""}${data.projections.monthOverMonthRevenuePct.toFixed(1)}%`
                  : "n/a"}
              </li>
              <li>
                <strong className="text-slate-300">Annual run rate (×12):</strong>{" "}
                {data.projections.annualRunRate.toFixed(2)}
              </li>
              <li>
                <strong className="text-slate-300">Simple 90d forward:</strong>{" "}
                {data.projections.projectedRevenue90d.toFixed(2)}
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-600">{data.projections.disclaimer}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-sm font-semibold text-white">Revenue & unit economics</h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
                <li>
                  <strong className="text-slate-300">Revenue (30d):</strong> {data.display.revenue.toFixed(2)} (platform
                  currency)
                </li>
                <li>
                  <strong className="text-slate-300">Revenue per active user:</strong> {data.kpis.revenuePerUser.toFixed(2)}
                </li>
                <li>
                  <strong className="text-slate-300">CAC:</strong>{" "}
                  {data.kpis.cac != null ? `$${data.kpis.cac.toFixed(2)}` : "n/a — configure marketing spend"}
                </li>
                <li>
                  <strong className="text-slate-300">Conversion:</strong> {(data.display.conversionRate * 100).toFixed(1)}%
                  (won / won+lost)
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-sm font-semibold text-white">Growth</h3>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
                <li>
                  <strong className="text-slate-300">User base:</strong> {data.display.totalUsers} total,{" "}
                  {data.display.activeUsers} active (30d)
                </li>
                <li>
                  <strong className="text-slate-300">Engagement:</strong> {data.kpis.activeUsersPct.toFixed(1)}% of users
                  active in last 30 days
                </li>
                <li>
                  <strong className="text-slate-300">Bookings (30d):</strong> {data.display.bookings} — rate vs actives:{" "}
                  {data.kpis.bookingRate.toFixed(4)}
                </li>
                <li>
                  <strong className="text-slate-300">Series growth (users):</strong>{" "}
                  {growthYoY != null ? `${growthYoY >= 0 ? "+" : ""}${growthYoY.toFixed(1)}%` : "Need ≥2 snapshots"}
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link prefetch={false} href="/api/admin/investor-metrics/export?format=csv" className="text-sm text-amber-300 underline">
              Export full metrics CSV
            </Link>
            <Link prefetch={false} href="/api/admin/investor-metrics/export?format=funnel" className="text-sm text-cyan-400 underline">
              Funnel CSV
            </Link>
            <Link prefetch={false} href="/api/admin/investor-metrics/export?format=projections" className="text-sm text-pink-400 underline">
              Projections CSV
            </Link>
            <Link prefetch={false} href="/api/admin/investor-metrics/export?format=report" className="text-sm text-slate-400 underline">
              Full text report
            </Link>
          </div>
        </div>
      )}

      {tab === "pitch" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">Pitch summary</h3>
            {data.pitchDeck ? (
              <>
                <h4 className="mt-1 text-lg font-semibold text-white">{data.pitchDeck.title}</h4>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-600">{data.pitchDeck.createdAtLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{summaryLine}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">{summaryLine}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copy(summaryLine)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                Copy summary
              </button>
              {pitchMd ? (
                <>
                  <button
                    type="button"
                    onClick={() => void copy(pitchMd)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    Copy full deck (Markdown)
                  </button>
                  <Link
                    prefetch={false}
                    href="/api/admin/investor/export"
                    className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/10"
                  >
                    Download bundle (.md)
                  </Link>
                </>
              ) : null}
              <Link href="/admin/pitch-deck" className="rounded-lg border border-sky-500/30 px-3 py-1.5 text-xs text-sky-300">
                Edit in generator
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Slide-by-slide</h3>
            <ul className="mt-4 space-y-4">
              {data.pitchDeck?.slides.map((s) => (
                <li key={`${s.order}-${s.title}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-500">
                        Slide {s.order} · {s.type}
                      </span>
                      <p className="mt-1 font-medium text-white">{s.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void copy(`## ${s.title}\n\n${contentToText(s.content)}`)
                      }
                      className="shrink-0 text-xs text-amber-300/90 hover:underline"
                    >
                      Copy slide
                    </button>
                  </div>
                  <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900/80 p-3 text-xs text-slate-400">
                    {contentToText(s.content)}
                  </pre>
                </li>
              )) ?? (
                <li className="text-sm text-slate-500">No slides yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "qa" && <AdminInvestorQAPanel />}
    </div>
  );
}
