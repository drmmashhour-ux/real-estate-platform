import Link from "next/link";
import { subDays } from "date-fns";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import { computeRevenueHealth } from "@/lib/revenue-autopilot/compute-revenue-health";
import { getTopEarners } from "@/lib/revenue-autopilot/get-top-earners";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRevenueAutopilotPage() {
  await requireAdminControlUserId();

  const since = subDays(new Date(), 90);

  const [
    riskAlerts,
    platformHealth,
    bookingsByCity,
    topListingsRaw,
    pendingActions,
    recentOpps,
    actionStatusSummary,
    opportunityLeaderboard,
  ] = await Promise.all([
    getAdminRiskAlerts(),
    computeRevenueHealth({ scopeType: "platform", scopeId: REVENUE_PLATFORM_SCOPE_ID }),
    prisma.booking.findMany({
      where: { status: "COMPLETED", createdAt: { gte: since } },
      select: { totalCents: true, listing: { select: { city: true } } },
    }),
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { status: "COMPLETED", createdAt: { gte: since } },
      _sum: { totalCents: true },
    }),
    prisma.revenueAutopilotAction.count({
      where: { scopeType: "platform", scopeId: REVENUE_PLATFORM_SCOPE_ID, status: "suggested" },
    }),
    prisma.revenueOpportunityLog.findMany({
      where: { scopeType: "platform", scopeId: REVENUE_PLATFORM_SCOPE_ID },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.revenueAutopilotAction.groupBy({
      by: ["status"],
      where: { scopeType: "platform", scopeId: REVENUE_PLATFORM_SCOPE_ID },
      _count: { _all: true },
    }),
    prisma.revenueOpportunityLog.findMany({
      where: {
        scopeType: "platform",
        scopeId: REVENUE_PLATFORM_SCOPE_ID,
        estimatedRevenueCents: { not: null },
      },
      orderBy: { estimatedRevenueCents: "desc" },
      take: 15,
    }),
  ]);

  const cityMap = new Map<string, number>();
  for (const b of bookingsByCity) {
    const c = b.listing?.city ?? "unknown";
    cityMap.set(c, (cityMap.get(c) ?? 0) + b.totalCents);
  }
  const cityRows = [...cityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const topListingsGlobal = [...topListingsRaw]
    .sort((a, b) => (b._sum.totalCents ?? 0) - (a._sum.totalCents ?? 0))
    .slice(0, 15);
  const listingIds = topListingsGlobal.map((t) => t.listingId);
  const listingMeta = await prisma.shortTermListing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, title: true, listingCode: true, city: true },
  });
  const metaById = new Map(listingMeta.map((l) => [l.id, l]));

  const topEarners = getTopEarners(platformHealth.listings, 10);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  const underperforming = platformHealth.listings
    .filter((l) => l.views30d > 60 && l.revenue90dCents < 20_000)
    .slice(0, 8);

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Revenue autopilot</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform-wide monetization snapshot (BNHub short-term / `Booking` revenue). FSBO and other hubs are out of
            scope for this MVP view. See{" "}
            <code className="text-zinc-400">docs/optimization/revenue-autopilot.md</code>.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Platform revenue health (sample)</h2>
          <p className="mt-1 text-3xl font-mono text-emerald-300">{platformHealth.revenueScore}</p>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{platformHealth.summary}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Gross by city (90d, completed)</h2>
          <p className="mt-1 text-xs text-zinc-500">Hub: BNHub short-term stays (`Booking` totals; same universe as health sample).</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {cityRows.map(([city, cents]) => (
              <li key={city}>
                {city}: {Math.round(cents / 100).toLocaleString()}
              </li>
            ))}
            {cityRows.length === 0 ? <li>No data.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Top revenue listings (sample cap)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {topListingsGlobal.map((t) => {
              const m = metaById.get(t.listingId);
              const cents = t._sum.totalCents ?? 0;
              return (
                <li key={t.listingId}>
                  {m?.listingCode ?? t.listingId.slice(0, 8)} · {m?.title ?? "—"} · {Math.round(cents / 100)}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Underperforming segments (heuristic)</h2>
          <p className="mt-1 text-xs text-zinc-500">High views, very low revenue in sample — needs host follow-up.</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {underperforming.map((l) => (
              <li key={l.listingId}>
                {l.listingCode} · {l.city} · views {l.views30d} · rev {Math.round(l.revenue90dCents / 100)}
              </li>
            ))}
            {underperforming.length === 0 ? <li>None in sample.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Platform revenue actions (by status)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {actionStatusSummary.map((r) => (
              <li key={r.status}>
                {r.status}: {r._count._all}
              </li>
            ))}
            {actionStatusSummary.length === 0 ? <li>No platform actions yet.</li> : null}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Pending (suggested only): <span className="font-mono text-amber-300">{pendingActions}</span>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Opportunity log (recent)</h2>
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {recentOpps.map((o) => (
              <li key={o.id}>
                {o.opportunityType} · {o.notes?.slice(0, 80) ?? "—"}
              </li>
            ))}
            {recentOpps.length === 0 ? <li>No platform opportunities logged yet — run platform analysis.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Opportunity leaderboard (estimated uplift)</h2>
          <p className="mt-1 text-xs text-zinc-500">Platform-scope logs with highest `estimatedRevenueCents`.</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {opportunityLeaderboard.map((o) => (
              <li key={o.id}>
                {o.opportunityType} · est. +{Math.round((o.estimatedRevenueCents ?? 0) / 100)} ·{" "}
                {o.notes?.slice(0, 60) ?? "—"}
              </li>
            ))}
            {opportunityLeaderboard.length === 0 ? <li>No estimated-uplift rows yet.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Top earners (sample listings)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {topEarners.map((l) => (
              <li key={l.listingId}>
                {l.listingCode} · {l.title.slice(0, 40)} · {Math.round(l.revenue90dCents / 100)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
