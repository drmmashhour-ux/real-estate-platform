import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { AdminInvestorMetricsCharts } from "@/components/admin/AdminInvestorMetricsCharts";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  getMarketplaceMetrics,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";
import { captureAndStoreMetricSnapshot, getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";

export const dynamic = "force-dynamic";

export default async function AdminInvestorMetricsPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const now = new Date();
  const [snapshots, liveSnap, kpis, marketplace] = await Promise.all([
    getRecentMetricSnapshots(90),
    aggregateSnapshotInputs(now),
    computeLiveKpis(now),
    getMarketplaceMetrics(now),
  ]);

  let latest = snapshots[0] ?? null;
  if (!latest) {
    try {
      await captureAndStoreMetricSnapshot(now);
      const again = await getRecentMetricSnapshots(1);
      latest = again[0] ?? null;
    } catch {
      /* migrations may not be applied */
    }
  }

  const chartData = [...snapshots]
    .reverse()
    .map((r) => ({
      date: utcDayStart(r.date).toISOString().slice(0, 10),
      totalUsers: r.totalUsers,
      activeUsers: r.activeUsers,
      totalListings: r.totalListings,
      bookings: r.bookings,
      revenue: r.revenue,
      conversionPct: r.conversionRate * 100,
    }));

  const display = latest ?? {
    totalUsers: liveSnap.totalUsers,
    activeUsers: liveSnap.activeUsers,
    totalListings: liveSnap.totalListings,
    bookings: liveSnap.bookings,
    revenue: liveSnap.revenue,
    conversionRate: liveSnap.conversionRate,
    date: utcDayStart(now),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Investor relations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Investor reporting</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Growth, revenue, bookings, and conversion from daily <code className="text-slate-500">MetricSnapshot</code> rows
            plus live 30d KPIs. Export CSV (full history) or a one-page text report for diligence.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <a
              href="/api/admin/investor-metrics/export?format=csv"
              className="text-amber-300/90 underline hover:text-amber-200"
            >
              Export CSV
            </a>
            <a
              href="/api/admin/investor-metrics/export?format=report"
              className="text-amber-300/90 underline hover:text-amber-200"
            >
              Download report (.txt)
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Key metrics (30d window)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Snapshot date:{" "}
            <span className="font-mono text-slate-400">{utcDayStart(display.date).toISOString().slice(0, 10)}</span>
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Growth — total users</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{display.totalUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Active users (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-300">{display.activeUsers}</p>
              <p className="mt-1 text-xs text-slate-500">{kpis.activeUsersPct.toFixed(1)}% of all users</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Bookings (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-amber-300">{display.bookings}</p>
              <p className="mt-1 text-xs text-slate-500">Rate vs active: {kpis.bookingRate.toFixed(4)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Revenue (30d sum)</p>
              <p className="mt-1 text-2xl font-semibold text-pink-300">{display.revenue.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">Per active user: {kpis.revenuePerUser.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Conversion (won / won+lost)</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{(display.conversionRate * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">CAC (basic)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-200">
                {kpis.cac != null ? `$${kpis.cac.toFixed(2)}` : "n/a"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Set INVESTOR_MARKETING_SPEND_30D for spend input</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Live listings</p>
              <p className="mt-1 text-2xl font-semibold text-violet-300">{display.totalListings}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Marketplace</h2>
          <p className="mt-1 text-sm text-slate-500">Supply vs demand and broker responsiveness (30d samples).</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs uppercase text-slate-500">Buyer-persona users</p>
              <p className="mt-1 text-xl font-semibold">{marketplace.buyerPersonaUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs uppercase text-slate-500">Buyers / listings</p>
              <p className="mt-1 text-xl font-semibold">{marketplace.buyersToListingsRatio.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs uppercase text-slate-500">Supply / demand index</p>
              <p className="mt-1 text-xl font-semibold">{marketplace.supplyDemandIndex.toFixed(2)}</p>
              <p className="mt-1 text-[11px] text-slate-500">Listings ÷ (leads + buyer requests, 30d)</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-xs uppercase text-slate-500">Broker ≤24h response</p>
              <p className="mt-1 text-xl font-semibold">{(marketplace.brokerResponseRate * 100).toFixed(1)}%</p>
              <p className="mt-1 text-[11px] text-slate-500">n={marketplace.brokerResponseSampleSize} assigned leads</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Trends</h2>
          <p className="mt-1 text-sm text-slate-500">Daily snapshot history (up to 90 points): user growth, revenue trend, bookings, conversion.</p>
          <div className="mt-6">
            <AdminInvestorMetricsCharts data={chartData} />
          </div>
          <p className="mt-8 text-center text-xs font-medium tracking-wide text-sky-500/90">
            LECIPM INVESTOR SYSTEM READY
          </p>
        </div>
      </section>
    </main>
  );
}
