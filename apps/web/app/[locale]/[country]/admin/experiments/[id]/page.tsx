import Link from "next/link";
import { notFound } from "next/navigation";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getExperimentResults } from "@/lib/experiments/get-results";
import {
  archiveExperimentAction,
  completeExperimentAction,
  pauseExperimentAction,
  setWinnerVariantAction,
  startExperimentAction,
  stopVariantAction,
} from "@/lib/experiments/admin-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminExperimentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminControlUserId();
  const { id } = await params;

  const [experiment, riskAlerts] = await Promise.all([
    prisma.experiment.findUnique({
      where: { id },
      include: { variants: { orderBy: { variantKey: "asc" } } },
    }),
    getAdminRiskAlerts(),
  ]);

  if (!experiment) notFound();

  const results = await getExperimentResults(prisma, id);

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
          <Link href="/admin/experiments" className="text-sm text-emerald-400 hover:text-emerald-300">
            ← All experiments
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">{experiment.name}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{experiment.slug}</p>
          <p className="mt-2 text-sm text-zinc-400">{experiment.hypothesis ?? "—"}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {experiment.status === "draft" ? (
            <form action={startExperimentAction.bind(null, id)}>
              <button type="submit" className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-500">
                Start experiment
              </button>
            </form>
          ) : null}
          {experiment.status === "running" ? (
            <form action={pauseExperimentAction.bind(null, id)}>
              <button type="submit" className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500">
                Pause
              </button>
            </form>
          ) : null}
          {experiment.status === "running" || experiment.status === "paused" ? (
            <form action={completeExperimentAction.bind(null, id)}>
              <button type="submit" className="rounded-lg bg-zinc-600 px-3 py-1.5 font-medium text-white hover:bg-zinc-500">
                Mark complete
              </button>
            </form>
          ) : null}
          <form action={archiveExperimentAction.bind(null, id)}>
            <button type="submit" className="rounded-lg border border-zinc-600 px-3 py-1.5 font-medium text-zinc-200 hover:bg-zinc-800">
              Archive
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4 text-sm text-zinc-300">
            <p className="text-xs uppercase text-zinc-500">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{experiment.status}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Surface <span className="font-mono text-zinc-400">{experiment.targetSurface}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Primary metric{" "}
              <span className="font-mono text-zinc-400">{experiment.primaryMetric}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4 text-sm text-zinc-300">
            <p className="text-xs uppercase text-zinc-500">Signal (MVP heuristic)</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{results.overallLabel.replace(/_/g, " ")}</p>
            {results.winnerSuggestion ? (
              <p className="mt-2 text-xs text-zinc-400">{results.winnerSuggestion.reason}</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Not enough separation yet — keep collecting assignments.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Traffic split (config)</h2>
          <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
            {JSON.stringify(experiment.trafficSplitJson, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Variants</h2>
          <ul className="mt-3 space-y-3">
            {experiment.variants.map((v) => (
              <li key={v.id} className="rounded-xl border border-zinc-800 bg-[#111] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-emerald-300">{v.variantKey}</p>
                    <p className="text-sm text-white">{v.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={setWinnerVariantAction.bind(null, id, v.variantKey)}>
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-800 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Mark winner
                      </button>
                    </form>
                    <form action={stopVariantAction.bind(null, id, v.variantKey)}>
                      <button
                        type="submit"
                        className="rounded-md bg-red-900/80 px-2 py-1 text-xs font-medium text-white hover:bg-red-800"
                      >
                        Stop variant
                      </button>
                    </form>
                  </div>
                </div>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-zinc-950 p-2 text-[11px] text-zinc-400">
                  {JSON.stringify(v.configJson, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Results by variant</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Conversion = primary metric count ÷ assignments. Lift vs control ({results.controlVariantKey}). MVP only —
            not a substitute for power analysis or CUPED.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-sm text-zinc-200">
              <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Assignments</th>
                  <th className="px-3 py-2">Primary metric</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Lift vs control</th>
                  <th className="px-3 py-2">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-[#111]">
                {results.variants.map((row) => (
                  <tr key={row.variantKey}>
                    <td className="px-3 py-2 font-mono text-xs text-emerald-300">{row.variantKey}</td>
                    <td className="px-3 py-2 text-xs text-zinc-300">{row.name}</td>
                    <td className="px-3 py-2">{row.assignments}</td>
                    <td className="px-3 py-2">{row.primaryMetricCount}</td>
                    <td className="px-3 py-2">{(row.primaryRate * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2">
                      {row.liftVsControlPercent != null ? `${row.liftVsControlPercent.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.signalLabel.replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {experiment.winnerVariantKey ? (
            <p className="mt-3 text-sm text-amber-200">
              Recorded winner: <span className="font-mono">{experiment.winnerVariantKey}</span>
            </p>
          ) : null}
        </div>
      </div>
    </LecipmControlShell>
  );
}
