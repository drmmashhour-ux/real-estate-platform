import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AutonomyExperimentsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/autonomy/experiments`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const experiments = await prisma.autonomyExperiment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      assignments: { select: { group: true } },
      results: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            BNHub · autonomy · experiments
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Holdout experiments</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Deterministic control vs treatment assignment — measures observed KPI differences internally. Not a randomized clinical
            trial; interpret uplift as operational validation only. Policy and manual locks still win; start with low treatment traffic
            (≈10–20%).
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin/autonomy`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Autonomy
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Experiments</h2>
        <p className="mt-1 text-xs text-[#737373]">
          POST <code className="text-zinc-400">/api/autonomy/experiment</code> (draft) · POST init · run · status (pause) · GET
          results — admin or <code className="text-zinc-400">x-autonomy-experiment-secret</code> (see .env.example).
        </p>
        <div className="mt-4 space-y-6">
          {experiments.length === 0 ? (
            <p className="text-sm text-[#737373]">
              No rows — POST <code className="text-zinc-400">/api/autonomy/experiment</code> (draft), set{" "}
              <code className="text-zinc-400">trafficSplit</code> to 0.1–0.2, POST init, then POST status{" "}
              <code className="text-zinc-400">running</code>.
            </p>
          ) : (
            experiments.map((exp) => {
              const latest = exp.results[0];
              const nAssign = exp.assignments.length;
              const nTreat = exp.assignments.filter((a) => a.group === "treatment").length;
              const nCtrl = exp.assignments.filter((a) => a.group === "control").length;
              const maxRev = Math.max(Number(latest?.treatmentRevenue ?? 0), Number(latest?.controlRevenue ?? 0), 1);
              const tPct = maxRev > 0 ? (Number(latest?.treatmentRevenue ?? 0) / maxRev) * 100 : 0;
              const cPct = maxRev > 0 ? (Number(latest?.controlRevenue ?? 0) / maxRev) * 100 : 0;
              const upliftPct =
                latest && Number(latest.controlRevenue) !== 0
                  ? (((Number(latest.treatmentRevenue) - Number(latest.controlRevenue)) / Number(latest.controlRevenue)) * 100).toFixed(1)
                  : "—";

              return (
                <div key={exp.id} className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-[#B3B3B3]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-medium text-white">{exp.name}</div>
                    <div className="text-xs uppercase text-[#737373]">{exp.status}</div>
                  </div>
                  <div className="mt-2 text-xs">
                    {exp.domain} · {exp.signalKey} · {exp.actionType} · split {(exp.trafficSplit * 100).toFixed(0)}% treatment
                  </div>
                  <div className="mt-1 text-xs">
                    Assignments: {nAssign} ({nTreat} treatment / {nCtrl} control)
                  </div>

                  {latest ? (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-[#737373]">Latest snapshot (mean revenue per outcome row)</div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500">Treatment avg revenue</div>
                          <div className="h-2 overflow-hidden rounded bg-white/10">
                            <div className="h-full bg-emerald-500/80" style={{ width: `${tPct}%` }} />
                          </div>
                          <div className="mt-1 font-mono text-xs text-white">{latest.treatmentRevenue.toFixed(2)}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500">Control avg revenue</div>
                          <div className="h-2 overflow-hidden rounded bg-white/10">
                            <div className="h-full bg-slate-500/80" style={{ width: `${cPct}%` }} />
                          </div>
                          <div className="mt-1 font-mono text-xs text-white">{latest.controlRevenue.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 pt-2 text-xs">
                        <span>
                          Uplift (abs): <span className="text-white">{latest.upliftRevenue.toFixed(2)}</span>
                        </span>
                        <span>
                          Uplift vs control: <span className="text-white">{upliftPct}%</span>
                        </span>
                        <span>
                          Confidence (heuristic): <span className="text-white">{latest.confidenceScore.toFixed(2)}</span>
                        </span>
                        <span>
                          Sample (outcome rows): <span className="text-white">{latest.sampleSize}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#737373]">No aggregated results yet — POST /api/autonomy/experiment/run.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
