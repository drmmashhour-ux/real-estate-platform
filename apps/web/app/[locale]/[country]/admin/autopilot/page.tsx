import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAutopilotPage() {
  await requireAdminControlUserId();

  const [riskAlerts, runCounts, appliedCount, pendingHigh, topImproved, runFrequency] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.listingOptimizationRun.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.listingOptimizationSuggestion.count({ where: { status: "applied" } }),
    prisma.listingOptimizationSuggestion.count({
      where: { status: "suggested", riskLevel: "high" },
    }),
    prisma.listingOptimizationAudit.groupBy({
      by: ["listingId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    prisma.listingOptimizationRun.groupBy({
      by: ["listingId"],
      _count: { _all: true },
    }),
  ]);

  const repeatRuns = runFrequency
    .filter((r) => r._count._all >= 3)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 15);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  const listingTitles = await prisma.shortTermListing.findMany({
    where: { id: { in: [...topImproved.map((t) => t.listingId), ...repeatRuns.map((t) => t.listingId)] } },
    select: { id: true, title: true, listingCode: true },
  });
  const titleById = new Map(listingTitles.map((l) => [l.id, l]));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Listing optimization autopilot</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Runs, suggestions, and audit trail. See <code className="text-zinc-400">docs/optimization/auto-fix-autopilot.md</code>.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
            <Link href="../portfolio-autopilot" className="text-amber-200/90 hover:underline">
              Portfolio autopilot
            </Link>
            <Link href="../revenue-autopilot" className="text-emerald-300/90 hover:underline">
              Revenue autopilot
            </Link>
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Run status totals</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {runCounts.map((r) => (
              <li key={r.status}>
                {r.status}: {r._count._all}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Applied fixes (all time)</h2>
          <p className="mt-1 text-2xl font-mono text-zinc-200">{appliedCount}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Pending high-risk suggestions</h2>
          <p className="mt-1 text-2xl font-mono text-amber-300">{pendingHigh}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Most-improved listings (by audit volume)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {topImproved.map((t) => {
              const meta = titleById.get(t.listingId);
              return (
                <li key={t.listingId}>
                  {meta?.listingCode} · {meta?.title ?? t.listingId} · {t._count.id} audit events
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Repeatedly optimized listings (3+ runs)</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            {repeatRuns.map((t) => {
              const meta = titleById.get(t.listingId);
              return (
                <li key={t.listingId}>
                  {meta?.listingCode} · {meta?.title ?? t.listingId} · {t._count._all} runs
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
