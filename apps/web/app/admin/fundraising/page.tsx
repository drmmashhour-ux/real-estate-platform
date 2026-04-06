import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { FundraisingAdminClient } from "@/components/admin/FundraisingAdminClient";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";
import { utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";
import { getRevenueEngineDashboardStats } from "@/src/modules/revenue/revenueEngine";
import { FUNDRAISING_STAGES } from "@/src/modules/fundraising/constants";
import { getPipelineSummary, listFundraisingInvestors } from "@/src/modules/fundraising/pipeline";
import {
  getOrCreateOpen100kRound,
  listCommitmentsForRound,
} from "@/src/modules/fundraising/round";
import {
  roundProgressPercent,
  roundRemaining,
} from "@/src/modules/fundraising/roundMetrics";

export const dynamic = "force-dynamic";

export default async function AdminFundraisingPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  let investors: Awaited<ReturnType<typeof listFundraisingInvestors>> = [];
  let summary: Awaited<ReturnType<typeof getPipelineSummary>> | null = null;
  let snap: Awaited<ReturnType<typeof getRecentMetricSnapshots>>[0] | null = null;
  let engine: Awaited<ReturnType<typeof getRevenueEngineDashboardStats>> | null = null;
  let round100k: Awaited<ReturnType<typeof getOrCreateOpen100kRound>> | null = null;
  let commitments: Awaited<ReturnType<typeof listCommitmentsForRound>> = [];

  try {
    [investors, summary, snap, engine] = await Promise.all([
      listFundraisingInvestors(),
      getPipelineSummary(20),
      getRecentMetricSnapshots(1).then((r) => r[0] ?? null),
      getRevenueEngineDashboardStats(),
    ]);
  } catch {
    /* core fundraising tables may not exist until migration */
  }

  try {
    round100k = await getOrCreateOpen100kRound();
    commitments = await listCommitmentsForRound(round100k.id);
  } catch {
    /* fundraising_rounds / investor_commitments may not exist until migration */
    round100k = null;
    commitments = [];
  }

  const target = round100k?.targetAmount ?? 100_000;
  const raised = round100k?.raisedAmount ?? 0;
  const remaining = roundRemaining(target, raised);
  const progressPct = roundProgressPercent(target, raised);

  const latest = snap;
  const byStageOrdered = FUNDRAISING_STAGES.map((stage) => ({
    stage,
    count: summary?.byStage[stage] ?? 0,
    rows: investors.filter((i) => i.stage === stage),
  }));

  const clientInvestors = investors.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    firm: i.firm,
    stage: i.stage,
    nextFollowUpAt: i.nextFollowUpAt ? i.nextFollowUpAt.toISOString() : null,
    _count: i._count,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Capital</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Fundraising</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Track investors, outreach, conversations, and pipeline value. Traction pulls from investor metrics
            snapshots and the revenue engine.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <Link href="/admin/investor" className="text-sky-400 hover:text-sky-300">
              Investor metrics →
            </Link>
            <Link href="/admin/revenue" className="text-amber-300/90 hover:text-amber-200">
              Revenue engine →
            </Link>
            <a
              href="/api/admin/fundraising/export?format=json"
              className="text-amber-300/90 underline hover:text-amber-200"
            >
              Export JSON
            </a>
            <a
              href="/api/admin/fundraising/export?format=csv"
              className="text-amber-300/90 underline hover:text-amber-200"
            >
              Export CSV
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-violet-950/20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-violet-500/35 bg-violet-950/40 px-4 py-3 text-center text-sm font-semibold tracking-wide text-violet-200">
            LECIPM 100K FUNDRAISING SYSTEM ACTIVE
          </div>
          <h2 className="mt-8 text-lg font-semibold text-white">$100K round</h2>
          <p className="mt-1 text-sm text-slate-400">
            Track who committed, how much, and progress toward the round target. Raised total includes
            commitments marked committed or transferred.
          </p>
          {round100k ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase text-slate-500">Total raised</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">
                    ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">Round status: {round100k.status}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase text-slate-500">Remaining to target</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-200/90">
                    ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Target ${target.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs uppercase text-slate-500">Progress</p>
                  <p className="mt-1 text-2xl font-semibold text-violet-300">
                    {progressPct.toFixed(1)}%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-300">Investors & commitments</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Investor</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Commitment id</th>
                        <th className="px-3 py-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commitments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                            No commitments yet. Add one under Actions (round commitment).
                          </td>
                        </tr>
                      ) : (
                        commitments.map((c) => (
                          <tr key={c.id} className="border-b border-slate-800/80">
                            <td className="px-3 py-2 text-white">
                              {c.investor.name}
                              <span className="block text-xs text-slate-500">
                                {c.investor.firm || c.investor.email}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              ${c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-3 py-2 capitalize text-slate-400">{c.status}</td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{c.id}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">
                              {c.updatedAt.toISOString().slice(0, 19)}Z
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Round data unavailable until migration is applied (fundraising_rounds / investor_commitments).
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Traction (metrics + revenue)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Users (snapshot)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{latest?.totalUsers ?? "—"}</p>
              <p className="mt-1 text-[11px] text-slate-600">
                day {latest ? utcDayStart(latest.date).toISOString().slice(0, 10) : "n/a"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Revenue (30d window)</p>
              <p className="mt-1 text-2xl font-semibold text-pink-300">
                {latest != null ? latest.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Bookings (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-amber-300">{latest?.bookings ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Revenue engine today</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-300">
                {engine != null
                  ? engine.revenueToday.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">Open opps: {engine?.openOpportunities ?? "—"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Pipeline</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Pipeline value (open + committed)</p>
              <p className="mt-1 text-2xl font-semibold text-violet-300">
                {summary != null
                  ? summary.pipelineValueOpenCommitted.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Committed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-200/90">
                {summary != null
                  ? summary.committedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Closed</p>
              <p className="mt-1 text-2xl font-semibold text-slate-200">
                {summary != null
                  ? summary.closedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {byStageOrdered.map(({ stage, count, rows }) => (
              <div key={stage}>
                <h3 className="text-sm font-semibold capitalize text-slate-300">
                  {stage} <span className="text-slate-500">({count})</span>
                </h3>
                {rows.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">No investors in this stage.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">
                    {rows.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                        <span className="font-medium text-white">{i.name}</span>
                        <span className="text-slate-500">{i.firm || i.email}</span>
                        <span className="text-xs text-slate-600">
                          {i._count.interactions} interactions · {i._count.deals} deals
                        </span>
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
          <h2 className="text-lg font-semibold text-white">Recent conversations</h2>
          <ul className="mt-4 space-y-3">
            {(summary?.recentInteractions ?? []).map((it) => (
              <li
                key={it.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300"
              >
                <span className="font-mono text-xs text-violet-400">{it.type}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span className="text-slate-400">{it.investor.name}</span>
                <p className="mt-1 text-slate-500 line-clamp-2">{it.summary}</p>
                <p className="mt-1 text-[11px] text-slate-600">{it.createdAt.toISOString().slice(0, 19)}Z</p>
              </li>
            ))}
            {summary && summary.recentInteractions.length === 0 ? (
              <li className="text-sm text-slate-600">No interactions logged yet.</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Creates rows in fundraising tables (admin only).</p>
          <div className="mt-6">
            <FundraisingAdminClient
              investors={clientInvestors}
              roundId={round100k?.id ?? null}
            />
          </div>
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-violet-400/90">
            LECIPM 100K FUNDRAISING SYSTEM ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}
