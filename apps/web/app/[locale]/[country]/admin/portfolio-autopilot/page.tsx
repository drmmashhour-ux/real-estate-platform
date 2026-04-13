import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPortfolioAutopilotPage() {
  await requireAdminControlUserId();

  const [riskAlerts, healthiest, struggling, actionSummary, topRevenue] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.portfolioHealthScore.findMany({
      orderBy: { portfolioHealthScore: "desc" },
      take: 20,
      include: {
        owner: { select: { email: true, name: true, userCode: true } },
      },
    }),
    prisma.portfolioHealthScore.findMany({
      where: { portfolioHealthScore: { lt: 50 } },
      orderBy: { portfolioHealthScore: "asc" },
      take: 20,
      include: {
        owner: { select: { email: true, name: true, userCode: true } },
      },
    }),
    prisma.portfolioAutopilotAction.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.portfolioHealthScore.findMany({
      orderBy: { revenueHealth: "desc" },
      take: 15,
      include: {
        owner: { select: { email: true, name: true, userCode: true } },
      },
    }),
  ]);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Portfolio autopilot</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cross-listing health, prioritized actions, and integration with listing optimization. See{" "}
            <code className="text-zinc-400">docs/optimization/portfolio-autopilot.md</code>.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Action queue (all owners)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {actionSummary.map((r) => (
              <li key={r.status}>
                {r.status}: {r._count._all}
              </li>
            ))}
            {actionSummary.length === 0 ? <li>No portfolio actions yet.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Healthiest portfolios (cached score)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {healthiest.map((h) => (
              <li key={h.id}>
                {h.owner?.userCode ?? h.ownerUserId.slice(0, 8)} · {h.owner?.email ?? "—"} · score{" "}
                {h.portfolioHealthScore}
              </li>
            ))}
            {healthiest.length === 0 ? <li>No portfolio health rows — hosts need to run analysis.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Lowest portfolio health (&lt; 50)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {struggling.map((h) => (
              <li key={h.id}>
                {h.owner?.userCode ?? h.ownerUserId.slice(0, 8)} · {h.owner?.email ?? "—"} · score{" "}
                {h.portfolioHealthScore}
              </li>
            ))}
            {struggling.length === 0 ? <li>None under threshold.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Top revenue health component (proxy)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Uses cached `revenueHealth` sub-score from the last portfolio run — not bank-confirmed revenue.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {topRevenue.map((h) => (
              <li key={h.id}>
                {h.owner?.userCode ?? h.ownerUserId.slice(0, 8)} · revenue health {h.revenueHealth} · overall{" "}
                {h.portfolioHealthScore}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
