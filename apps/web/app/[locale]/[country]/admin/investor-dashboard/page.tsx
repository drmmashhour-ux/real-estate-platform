import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { intelligenceFlags } from "@/config/feature-flags";
import { getInvestorDashboardBundle } from "@/src/modules/analytics/investor/analytics.engine";
import { KpiCard } from "@/components/intelligence/KpiCard";
import { RevenueChart } from "@/components/intelligence/RevenueChart";
import { MarketHeatmap } from "@/components/intelligence/MarketHeatmap";
import { LiquidityInsightsCard } from "@/components/intelligence/LiquidityInsightsCard";

export const dynamic = "force-dynamic";

export default async function InvestorIntelligenceDashboardPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const bundle = await getInvestorDashboardBundle(30);
  if (!bundle.ok) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-zinc-300">
        <p>
          Investor analytics bundle is disabled. Set{" "}
          <code className="rounded bg-zinc-800 px-1">FEATURE_ANALYTICS_DASHBOARD_V1=true</code> (and liquidity flag for
          supply/demand sections).
        </p>
        <Link href="/admin" className="mt-6 inline-block text-amber-400">
          ← Admin home
        </Link>
      </main>
    );
  }

  const { kpis, topCities, revenueByMonth, funnel, liquidityPreview } = bundle;

  const heatCells = liquidityPreview.map((x) => ({
    city: x.city,
    score: x.liquidityScore,
    label: x.interpretation,
  }));

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="border-b border-amber-900/30 bg-gradient-to-b from-zinc-950 to-black">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-500">Investor intelligence</p>
          <h1 className="mt-2 font-serif text-3xl text-amber-100">Supply · demand · conversion</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Internal aggregates only — no fabricated market claims. Liquidity uses listing + engagement joins.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/admin" className="text-amber-400/90 hover:text-amber-300">
              ← Admin home
            </Link>
            <span className="text-zinc-600">Flags: analytics={String(intelligenceFlags.analyticsDashboardV1)} · liquidity={String(intelligenceFlags.liquidityEngineV1)} · autopilot_v2={String(intelligenceFlags.autopilotV2)}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <section>
          <h2 className="font-serif text-lg text-amber-200/90">Platform KPIs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total listings (FSBO)" value={String(kpis.totalListings)} />
            <KpiCard label="Active FSBO" value={String(kpis.activeFsboListings)} />
            <KpiCard
              label="GMV (payments, window)"
              value={`$${(kpis.gmvCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
              hint="BNHub / payment rows in range"
            />
            <KpiCard
              label="Platform fees (approx)"
              value={`$${(kpis.platformRevenueCentsApprox / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
            />
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-amber-200/90">Revenue (completed payments)</h2>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <RevenueChart series={revenueByMonth} />
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-amber-200/90">Top markets (active FSBO)</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {topCities.map((c) => (
              <li key={c.city} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm">
                <span className="font-medium text-white">{c.city}</span>
                <span className="ml-2 text-zinc-500">{c.activeListings} active</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-amber-200/90">Liquidity preview</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {liquidityPreview.slice(0, 4).map((x) => (
              <LiquidityInsightsCard
                key={x.city}
                city={x.city}
                liquidityScore={x.liquidityScore}
                interpretation={x.interpretation}
              />
            ))}
          </div>
          <div className="mt-6">
            <MarketHeatmap cells={heatCells} />
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-amber-200/90">Funnel (analytics_events)</h2>
          <ul className="mt-4 space-y-1 text-sm text-zinc-400">
            {funnel.map((f) => (
              <li key={f.name}>
                {f.name}: <span className="text-white">{f.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
