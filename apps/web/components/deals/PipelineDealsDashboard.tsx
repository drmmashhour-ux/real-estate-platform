import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listPipelineDealsForUser } from "@/modules/deals/deal-pipeline.service";
import { getPipelineSummaryForViewer } from "@/modules/deals/deal-monitoring.service";
import { PipelineDealCreateForm } from "@/components/deals/PipelineDealCreateForm";

/**
 * Investment pipeline hub — CRM listing promotion, stats, active deals table.
 */
export async function PipelineDealsDashboard({
  localePrefix,
  dealDetailHref,
}: {
  localePrefix: string;
  /** Base path for deal detail links, e.g. `${localePrefix}/dashboard/deals` */
  dealDetailHref: string;
}) {
  const userId = await getGuestId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const [deals, summary] = await Promise.all([
    listPipelineDealsForUser(userId),
    getPipelineSummaryForViewer(userId, user?.role),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Investment workflow</p>
          <h1 className="font-serif text-2xl text-zinc-50">Deal pipeline</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Investment / IC pipeline (distinct from residential closing deals). Track stages, committee, conditions,
            and diligence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`${localePrefix}/dashboard/deals/committee`}
            className="rounded-lg border border-amber-700/50 px-3 py-2 text-amber-100 hover:bg-zinc-900"
          >
            Committee queue
          </Link>
          <Link
            href={`${localePrefix}/dashboard/deals/pipeline`}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900"
          >
            Portfolio summary
          </Link>
          <Link href={`${localePrefix}/dashboard/deals/closing`} className="text-zinc-400 hover:text-zinc-200">
            Closing deals →
          </Link>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 md:grid-cols-4">
        <Stat label="Total" value={summary.totalDeals} />
        <Stat label="Critical conditions" value={summary.criticalConditionsOpen} warn />
        <Stat label="Blocked diligence" value={summary.blockedDiligenceCount} warn />
        <Stat label="Committee queue" value={summary.upcomingCommitteeCount} />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Promote listing → pipeline deal</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Creates an investment pipeline deal linked to a CRM listing (optional). APIs:{" "}
          <code className="text-zinc-400">POST /api/deals/create</code> or{" "}
          <code className="text-zinc-400">POST /api/deals/pipeline</code>.
        </p>
        <div className="mt-4">
          <PipelineDealCreateForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Active deals</h2>
        {deals.length === 0 ?
          <p className="text-sm text-zinc-500">No pipeline deals yet.</p>
        : <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Next due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`${dealDetailHref}/${d.id}`}
                        className="font-medium text-amber-100 hover:underline"
                      >
                        {d.title}
                      </Link>
                      {d.listing?.listingCode ?
                        <span className="ml-2 text-xs text-zinc-500">{d.listing.listingCode}</span>
                      : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{d.pipelineStage}</td>
                    <td className="px-4 py-3 text-zinc-400">{d.decisionStatus ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{d.priority ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{d.ownerUser?.name ?? d.ownerUser?.email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {d.followUps[0]?.dueDate ?
                        new Date(d.followUps[0].dueDate).toLocaleDateString()
                      : "—"}
                      {d.conditions.length > 0 ?
                        <span className="ml-1 text-amber-400"> · {d.conditions.length} crit open</span>
                      : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </section>
    </main>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn && value > 0 ? "text-amber-300" : "text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}
