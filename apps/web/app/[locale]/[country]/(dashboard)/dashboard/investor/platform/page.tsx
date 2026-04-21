import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";

export const dynamic = "force-dynamic";

/**
 * Platform traction snapshot for fundraising / investor prep (ADMIN only).
 * Distinct from the investor portfolio hub at `/dashboard/investor`.
 */
export default async function InvestorPlatformTractionPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) {
    redirect(`/${locale}/${country}/dashboard/investor`);
  }

  const now = new Date();
  const end = utcDayStart(now);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [
    row,
    kpis,
    totalLeads,
    leads30,
    distributionRows,
    activeDeals,
    brokers,
    revenueAgg,
    patterns,
    patternCount,
    investmentSnaps,
  ] = await Promise.all([
    aggregateSnapshotInputs(now),
    computeLiveKpis(now),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: since30, lte: now } } }),
    prisma.lead.groupBy({
      by: ["distributionChannel"],
      where: { createdAt: { gte: since30, lte: now } },
      _count: { id: true },
    }),
    prisma.deal.count({
      where: { NOT: { status: { in: ["closed", "cancelled"] } } },
    }),
    prisma.user.count({ where: { role: "BROKER" } }),
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: since30, lte: now } },
      _sum: { amount: true },
    }),
    prisma.learningPattern.findMany({
      orderBy: { impactScore: "desc" },
      take: 5,
      select: { pattern: true, confidence: true, impactScore: true, sampleSize: true },
    }).catch(() => []),
    prisma.learningPattern.count().catch(() => 0),
    prisma.investmentOpportunity.count({
      where: { createdAt: { gte: since30, lte: now } },
    }).catch(() => 0),
  ]);

  const revenue30 = revenueAgg._sum.amount ?? 0;
  const conversionPct = row.conversionRate * 100;

  const channelBreakdown = distributionRows.map((r) => ({
    channel: r.distributionChannel ?? "(unset)",
    count: r._count.id,
  }));

  const centris30 = distributionRows
    .filter((r) => (r.distributionChannel ?? "").toUpperCase().includes("CENTRIS"))
    .reduce((s, r) => s + r._count.id, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Investor relations · MVP</p>
      <h1 className="mt-2 font-serif text-2xl text-white">Platform traction</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Rolling 30d window where noted. Estimates for internal storytelling — replace with audited figures before
        external distribution. Admin-only surface.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href={`/${locale}/${country}/dashboard/investor`}
          className="rounded-lg border border-white/15 px-4 py-2 text-slate-300 hover:bg-white/5"
        >
          ← Investor portfolio hub
        </Link>
        <Link href="/admin/investor/metrics" className="rounded-lg border border-amber-500/40 px-4 py-2 text-amber-200 hover:bg-amber-500/10">
          Extended metrics workspace
        </Link>
        <span className="rounded-lg border border-white/15 px-4 py-2 text-slate-500">
          Pitch: <code className="text-slate-400">docs/investors/lecimpm-final-pitch.md</code>
        </span>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total leads (all time)" value={String(totalLeads)} hint="CRM Lead rows" />
        <MetricCard label="New leads (30d)" value={String(leads30)} />
        <MetricCard
          label="Lead funnel conversion (proxy)"
          value={`${conversionPct.toFixed(1)}%`}
          hint="Won / (won+lost) in snapshot window — see metricsEngine"
        />
        <MetricCard
          label="Revenue (30d, internal events)"
          value={`$${(revenue30 / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint="RevenueEvent aggregate — reconcile with Stripe for external use"
        />
        <MetricCard label="Active deals (non-terminal)" value={String(activeDeals)} />
        <MetricCard label="Brokers (users)" value={String(brokers)} />
        <MetricCard label="CENTRIS-tagged leads (30d)" value={String(centris30)} hint="distributionChannel contains CENTRIS" />
        <MetricCard label="CAC (30d, if spend set)" value={kpis.cac != null ? `$${kpis.cac.toFixed(2)}` : "—"} />
        <MetricCard label="Investment opportunity snapshots (30d)" value={String(investmentSnaps)} />
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Lead sources (30d)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Compare CENTRIS vs platform-native using `distributionChannel` and campaign fields on leads.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {channelBreakdown.length === 0 ? (
            <li className="text-slate-500">No attributed leads in this window.</li>
          ) : (
            channelBreakdown.map((c) => (
              <li key={c.channel} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                <span>{c.channel}</span>
                <span className="font-mono text-amber-200/90">{c.count}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">AI &amp; learning signals</h2>
        <p className="mt-1 text-sm text-slate-400">
          Patterns are statistical summaries — not guarantees. Total stored patterns:{" "}
          <span className="font-mono text-white">{patternCount}</span>
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          {patterns.length === 0 ? (
            <li className="text-slate-500">
              No patterns yet — run learning maintenance after `DealOutcome` backfill / migration.
            </li>
          ) : (
            patterns.map((p) => (
              <li key={p.pattern.slice(0, 80)} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="text-slate-200">{p.pattern}</p>
                <p className="mt-2 text-xs text-slate-500">
                  confidence {p.confidence.toFixed(2)} · impact {p.impactScore.toFixed(1)} · n≈{p.sampleSize}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="mt-10 text-xs text-slate-600">
        Law 25: this page is restricted to administrators. Do not share raw exports without a lawful basis and
        retention review.
      </p>
    </main>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
