import Link from "next/link";
import { prisma } from "@repo/db";
import { getNetworkEffectMetrics, describeNetworkLoop, NETWORK_EFFECT_LOOP_MERMAID } from "@/src/modules/network-effects";
import { getMonetizationRollup } from "@/src/modules/monetization";
import { listLatestCompetitorSnapshots } from "@/src/modules/competitor-tracking";
import { countExclusivePublishedStays } from "@/src/modules/supply";
import { MonopolyDashboardClient, type MonopolyChartDatum } from "./MonopolyDashboardClient";

export const dynamic = "force-dynamic";

function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function MonopolyAdminPage() {
  const [net, money, expansion, exclusiveCount, compMontreal] = await Promise.all([
    getNetworkEffectMetrics(),
    getMonetizationRollup(),
    prisma.monopolyExpansionCity.findMany({ orderBy: { launchedAt: "desc" }, take: 12 }),
    countExclusivePublishedStays(),
    listLatestCompetitorSnapshots("montreal", 3),
  ]);

  const chartData: MonopolyChartDatum[] = [
    { name: "New listings (30d)", value: net.listingsGrowth30d },
    { name: "New users (30d)", value: net.usersGrowth30d },
    { name: "Leads (30d)", value: net.leads30d },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">LECIPM</p>
            <h1 className="font-serif text-3xl font-semibold text-white">Monopoly mode</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Supply control, demand aggregation, trust, expansion, pricing, competitors, and monetization in one
              surface.
            </p>
          </div>
          <Link
            href="/admin/revenue-optimization"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-amber-500/50"
          >
            Revenue optimization →
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <MonopolyDashboardClient data={chartData} />
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-semibold text-amber-200/90">Flywheel narrative</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {describeNetworkLoop({
                listingsPublished: net.listingsPublished,
                usersGrowth30d: net.usersGrowth30d,
                leads30d: net.leads30d,
              })}
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-snug text-slate-500">
              {NETWORK_EFFECT_LOOP_MERMAID}
            </pre>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Published stays" value={String(net.listingsPublished)} hint={`${net.listingsTotal} total`} />
          <MetricCard label="Users" value={String(net.usersTotal)} hint={`+${net.usersGrowth30d} / 30d`} />
          <MetricCard label="Leads / 30d" value={String(net.leads30d)} hint={net.leadGrowthPercent != null ? `${net.leadGrowthPercent}% vs prior` : "n/a"} />
          <MetricCard label="Exclusive stays" value={String(exclusiveCount)} hint="Supply tag" />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-lg font-semibold text-white">Monetization (90d, Stripe platform payments)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Gross revenue" value={formatCad(money.revenueCents90d)} hint={`${money.paidPayments90d} payments`} />
            <MetricCard
              label="Rev / listing (attrib.)"
              value={money.revenuePerListingApprox != null ? formatCad(money.revenuePerListingApprox) : "—"}
              hint="Listing-linked share"
            />
            <MetricCard
              label="Rev / paying user"
              value={money.revenuePerUserApprox != null ? formatCad(money.revenuePerUserApprox) : "—"}
              hint="Distinct payers"
            />
            <MetricCard
              label="Broker ROI proxy"
              value={formatCad(money.brokerAttributedCents90d)}
              hint="Broker commission accrual"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
            <h2 className="text-lg font-semibold text-white">Expansion cities</h2>
            {expansion.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No rows yet — run launchCity() or the validation script.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {expansion.map((c) => (
                  <li key={c.id} className="flex justify-between border-b border-slate-800/80 py-2">
                    <span className="text-slate-200">{c.displayName}</span>
                    <span className="text-slate-500">{c.slug}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
            <h2 className="text-lg font-semibold text-white">Competitor snapshots (Montreal)</h2>
            {compMontreal.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No snapshots — call recordCompetitorSnapshot from admin jobs.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {compMontreal.map((s) => (
                  <li key={s.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="font-medium text-amber-200/80">{s.competitorKey}</p>
                    <p className="mt-1 text-slate-400">
                      Platform listings: {s.platformListingCount ?? "—"} · Est. competitor: {s.competitorEstimate ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{s.recordedAt.toISOString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 text-sm text-slate-500">
          <p>
            Modules: <code className="text-slate-400">src/modules/supply</code>,{" "}
            <code className="text-slate-400">trust</code>, <code className="text-slate-400">demand-engine</code>,{" "}
            <code className="text-slate-400">expansion</code>, <code className="text-slate-400">pricing</code>,{" "}
            <code className="text-slate-400">competitor-tracking</code>, <code className="text-slate-400">network-effects</code>
            , <code className="text-slate-400">monetization</code>.
          </p>
          <p className="mt-2">
            SEO: neighborhood pages under <code className="text-slate-400">/city/[city]/n/[area]</code>.
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
