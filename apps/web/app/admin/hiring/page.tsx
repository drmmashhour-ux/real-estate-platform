import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HiringAdminClient } from "@/components/admin/HiringAdminClient";
import { prisma } from "@/lib/db";
import { HIRING_STAGES } from "@/src/modules/hiring/constants";

export const dynamic = "force-dynamic";

type CandidateWithCounts = Prisma.CandidateGetPayload<{
  include: {
    _count: { select: { interactions: true; evaluations: true; trialTasks: true } };
  };
}>;

type TrialWithCandidate = Prisma.CandidateTrialTaskGetPayload<{
  include: { candidate: { select: { name: true; email: true } } };
}>;

export default async function AdminHiringPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  let candidates: CandidateWithCounts[] = [];
  let trials: TrialWithCandidate[] = [];
  try {
    const [c, t] = await Promise.all([
      prisma.candidate.findMany({
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        include: {
          _count: { select: { interactions: true, evaluations: true, trialTasks: true } },
        },
      }),
      prisma.candidateTrialTask.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { candidate: { select: { name: true, email: true } } },
      }),
    ]);
    candidates = c;
    trials = t;
  } catch {
    /* migration pending */
  }

  const byStage = HIRING_STAGES.map((stage) => ({
    stage,
    rows: candidates.filter((c) => c.stage === stage),
  }));

  const best = candidates
    .filter((c) => c.score >= 7.5 || c.flag === "high_performer")
    .slice(0, 8);

  const clientCandidates = candidates.map((c) => ({ id: c.id, name: c.name, email: c.email }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">People</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hiring</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Structured evaluations (communication, speed, clarity, closing), trial tasks with quality tracking, pipeline
            stages, and auto-flags for high / low performers.
          </p>
          <div className="mt-4">
            <Link href="/admin" className="text-sm text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Best candidates</h2>
          <p className="mt-1 text-xs text-slate-500">Score ≥ 7.5 or flagged high_performer.</p>
          <ul className="mt-4 space-y-2">
            {best.length === 0 ? (
              <li className="text-sm text-slate-600">No standout rows yet — add evaluations.</li>
            ) : (
              best.map((c) => (
                <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm">
                  <span className="text-slate-200">
                    {c.name} <span className="text-slate-500">· {c.role}</span>
                  </span>
                  <span className="text-emerald-300">
                    score {c.score.toFixed(2)}
                    {c.flag ? <span className="ml-2 text-xs text-slate-500">({c.flag})</span> : null}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Pipeline by stage</h2>
          <div className="mt-6 space-y-8">
            {byStage.map(({ stage, rows }) => (
              <div key={stage}>
                <h3 className="text-sm font-semibold capitalize text-slate-300">
                  {stage} <span className="text-slate-500">({rows.length})</span>
                </h3>
                {rows.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">Empty.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">
                    {rows.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium text-white">{c.name}</span>
                          <span className="text-slate-500"> · {c.email}</span>
                          <p className="text-xs text-slate-600">
                            rubric {c.score.toFixed(2)} · {c._count.evaluations} evals · {c._count.trialTasks} trials ·
                            flag {c.flag ?? "—"}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">{c.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Recent trial tasks</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {trials.map((t) => (
              <li key={t.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800/60 py-2">
                <span>
                  {t.candidate.name} · <span className="font-mono text-xs text-slate-500">{t.taskKey}</span> · {t.status}
                </span>
                <span className="font-mono text-[11px] text-slate-600">{t.id}</span>
              </li>
            ))}
            {trials.length === 0 ? <li className="text-slate-600">No tasks yet.</li> : null}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Actions</h2>
          <div className="mt-4 max-w-xl">
            <HiringAdminClient candidates={clientCandidates} />
          </div>
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-cyan-400/90">
            LECIPM HIRING SYSTEM ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}
