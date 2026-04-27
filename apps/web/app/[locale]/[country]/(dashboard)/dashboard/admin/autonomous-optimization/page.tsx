import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { listLecipmAutonomousOptimizationRuns } from "@/lib/growth/autonomousOptimizationPersistence";

export const dynamic = "force-dynamic";

function priorityPill(p: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (p === "high") return `${base} bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40`;
  if (p === "medium") return `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
  return `${base} bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-600/50`;
}

type ActionRow = {
  id?: string;
  area?: string;
  priority?: string;
  safeToAutomate?: boolean;
  title?: string;
};

export default async function AutonomousOptimizationAdminPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(`${base}`);
  }

  const enabled = flags.AUTONOMOUS_OPTIMIZATION_LOOP;
  const runs = enabled ? await listLecipmAutonomousOptimizationRuns(20) : [];

  const latest = runs[0] ?? null;

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">BNHub · LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Autonomous optimization loop</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Signals → recommended actions → audit row + event log. No automatic price changes, bookings, refunds, or
          messaging. Compliance-sensitive work still requires manual approval.
        </p>
        <a href={base} className="mt-3 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </a>
      </div>

      {!enabled ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="font-medium">Autonomous optimization loop is disabled</p>
          <p className="mt-1 text-amber-200/80">
            Set <code className="font-mono text-amber-50/90">FEATURE_AUTONOMOUS_OPTIMIZATION_LOOP=1</code> or{" "}
            <code className="font-mono text-amber-50/90">FEATURE_AI_AGENT=1</code> (unless the loop is forced off with{" "}
            <code className="font-mono">FEATURE_AUTONOMOUS_OPTIMIZATION_LOOP=0</code>).
          </p>
        </div>
      ) : null}

      {enabled && runs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-400" data-testid="autonomous-opt-empty">
          <p className="font-medium text-zinc-300">No runs yet</p>
          <p className="mt-2">
            Trigger the loop via <code className="text-zinc-200">POST /api/optimization/autonomous</code> or the cron
            route. Latest audit rows will appear here.
          </p>
        </div>
      ) : null}

      {enabled && latest ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Latest run</h2>
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-4 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Run id</span>{" "}
              <code className="text-xs text-zinc-200">{latest.id}</code>
            </p>
            <p className="mt-2">
              <span className="text-zinc-500">Time</span> {latest.createdAt.toISOString()}
            </p>
            <p className="mt-1">
              <span className="text-zinc-500">Trigger</span> {latest.trigger} ·{" "}
              <span className="text-zinc-500">dryRun</span> {String(latest.dryRun)}
            </p>
            <p className="mt-1">
              <span className="text-zinc-500">Persisted in</span> <code>lecipm_autonomous_optimization_runs</code>
            </p>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions (priority order)</h3>
          <ul className="space-y-2">
            {(Array.isArray(latest.actions) ? (latest.actions as unknown as ActionRow[]) : []).map((a, i) => (
              <li
                key={`${a.id ?? i}`}
                className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{a.title ?? "—"}</p>
                  <p className="text-xs text-zinc-500">
                    {a.area ?? "—"} · safeToAutomate: {String(a.safeToAutomate ?? false)}
                  </p>
                </div>
                <span className={priorityPill((a.priority as string) || "low")}>{a.priority ?? "low"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
