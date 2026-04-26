import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  completeExperimentAction,
  createDraftExperimentFromFormAction,
  pauseExperimentAction,
  startExperimentAction,
} from "@/lib/experiments/admin-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExperimentsPage() {
  await requireAdminControlUserId();

  const [experiments, riskAlerts] = await Promise.all([
    prisma.experiment.findMany({
      where: { archivedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        variants: { select: { id: true, variantKey: true } },
        _count: { select: { assignments: true, events: true } },
      },
    }),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Experiments</h1>
          <p className="mt-1 text-sm text-zinc-500">
            A/B definitions, traffic splits, and lifecycle — wired to BNHub + marketing surfaces.
          </p>
        </div>

        <form action={createDraftExperimentFromFormAction} className="grid max-w-xl gap-3 rounded-2xl border border-zinc-800 bg-[#111] p-4 text-sm text-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Create draft (two-arm)</p>
          <input
            name="name"
            required
            placeholder="Experiment name"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600"
          />
          <input
            name="slug"
            required
            placeholder="unique-slug"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-white placeholder:text-zinc-600"
          />
          <input
            name="targetSurface"
            required
            placeholder="target surface e.g. lecipm_home_hero"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-white placeholder:text-zinc-600"
          />
          <input
            name="primaryMetric"
            placeholder="primary metric event name (default page_view)"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-white placeholder:text-zinc-600"
          />
          <input
            name="hypothesis"
            placeholder="Hypothesis (optional)"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600"
          />
          <div className="flex gap-2">
            <input
              name="v1k"
              defaultValue="control"
              className="w-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
            />
            <input
              name="v2k"
              defaultValue="b"
              className="w-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Create draft
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm text-zinc-200">
            <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Surface</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Primary metric</th>
                <th className="px-4 py-3">Assignments / events</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-[#111]">
              {experiments.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium text-white">
                    <Link href={`/admin/experiments/${e.id}`} className="hover:underline">
                      {e.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-zinc-500">{e.slug}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.targetSurface}</td>
                  <td className="px-4 py-3">{e.status}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.primaryMetric}</td>
                  <td className="px-4 py-3 text-xs">
                    {e._count.assignments.toLocaleString()} / {e._count.events.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {e.startAt ? e.startAt.toISOString().slice(0, 10) : "—"} →{" "}
                    {e.endAt ? e.endAt.toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {e.status === "draft" ? (
                        <form action={startExperimentAction.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="rounded-md bg-sky-700 px-2 py-1 text-xs font-medium text-white hover:bg-sky-600"
                          >
                            Start
                          </button>
                        </form>
                      ) : null}
                      {e.status === "running" ? (
                        <form action={pauseExperimentAction.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="rounded-md bg-amber-700 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
                          >
                            Pause
                          </button>
                        </form>
                      ) : null}
                      {e.status === "running" || e.status === "paused" ? (
                        <form action={completeExperimentAction.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="rounded-md bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-600"
                          >
                            Complete
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {experiments.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-500">No experiments yet — create a draft or run the DB seed.</p>
          ) : null}
        </div>
      </div>
    </LecipmControlShell>
  );
}
