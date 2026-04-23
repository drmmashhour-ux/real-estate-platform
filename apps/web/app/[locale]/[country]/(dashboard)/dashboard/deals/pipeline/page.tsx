import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getPipelineSummaryForViewer } from "@/modules/deals/deal-monitoring.service";

export const dynamic = "force-dynamic";

/** Portfolio-wide pipeline analytics (stage mix, bottlenecks, outcomes). */
export default async function DealPipelinePortfolioPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const summary = await getPipelineSummaryForViewer(userId, user?.role);

  const stageEntries = Object.entries(summary.byStage).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6 text-zinc-100">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <Link href={`${prefix}/dashboard/deals`} className="text-sm text-amber-400 hover:text-amber-300">
            ← Pipeline hub
          </Link>
          <h1 className="mt-4 font-serif text-2xl text-zinc-50">Pipeline portfolio view</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Uses <code className="text-zinc-500">GET /api/deals/pipeline/summary</code> aggregates — stage mix,
            decision posture, blocked work, committee queue.
          </p>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 md:grid-cols-4">
        <Metric label="Total deals" value={summary.totalDeals} />
        <Metric label="Critical conditions open" value={summary.criticalConditionsOpen} warn />
        <Metric label="Blocked diligence" value={summary.blockedDiligenceCount} warn />
        <Metric label="Committee queue" value={summary.upcomingCommitteeCount} />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">By stage</h2>
        <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          {stageEntries.length === 0 ?
            <li className="text-zinc-500">No deals in scope.</li>
          : stageEntries.map(([stage, count]) => (
              <li key={stage} className="flex justify-between rounded border border-zinc-800 px-3 py-2">
                <span className="text-zinc-300">{stage}</span>
                <span className="text-zinc-500">{count}</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Needs attention</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.dealsNeedingAttention.length === 0 ?
            <li className="text-zinc-500">None flagged.</li>
          : summary.dealsNeedingAttention.map((d) => (
              <li key={d.id}>
                <Link
                  href={`${prefix}/dashboard/deals/${d.id}`}
                  className="font-medium text-amber-100 hover:underline"
                >
                  {d.title}
                </Link>
                <span className="ml-2 text-zinc-500">
                  · {d.pipelineStage} · {d.reason}
                </span>
              </li>
            ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <h2 className="text-sm font-semibold text-emerald-200">Recently approved</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {summary.recentlyApproved.map((r) => (
              <li key={r.id}>
                <Link href={`${prefix}/dashboard/deals/${r.id}`} className="text-zinc-200 hover:underline">
                  {r.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-600">{new Date(r.updatedAt).toLocaleDateString()}</span>
              </li>
            ))}
            {summary.recentlyApproved.length === 0 ?
              <li className="text-zinc-600">None.</li>
            : null}
          </ul>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <h2 className="text-sm font-semibold text-red-300/90">Recently declined</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {summary.recentlyDeclined.map((r) => (
              <li key={r.id}>
                <Link href={`${prefix}/dashboard/deals/${r.id}`} className="text-zinc-200 hover:underline">
                  {r.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-600">{new Date(r.updatedAt).toLocaleDateString()}</span>
              </li>
            ))}
            {summary.recentlyDeclined.length === 0 ?
              <li className="text-zinc-600">None.</li>
            : null}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn && value > 0 ? "text-amber-300" : "text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}
