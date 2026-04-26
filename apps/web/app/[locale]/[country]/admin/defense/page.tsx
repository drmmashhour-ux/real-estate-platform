import Link from "next/link";
import { getActiveCrisisEvents } from "@/lib/defense/crisis-response";
import { getPendingApprovals } from "@/lib/defense/internal-access";
import { getPendingAppeals } from "@/lib/defense/enforcement";
import { getFinancialRiskFlags } from "@/lib/defense/financial-defense";
import { buildDefenseMetricsSnapshot } from "@/lib/defense/defense-analytics";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function DefenseDashboardPage() {
  const [crisis, approvals, appeals, riskFlags, snapshot] = await Promise.all([
    getActiveCrisisEvents(),
    getPendingApprovals(10),
    getPendingAppeals(10),
    getFinancialRiskFlags({ status: "OPEN", limit: 10 }),
    buildDefenseMetricsSnapshot({ date: new Date(), store: false }),
  ]);
  const acceptanceCount = await prisma.policyAcceptanceRecord.count();
  const enforcementCount = await prisma.enforcementAction.count({ where: { effectiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } });

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Platform Defense
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Defense dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Legal records, evidence, abuse, crisis, compliance, financial risk, enforcement, and analytics.
          </p>
          <div className="mt-4">
            <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Defense metrics (today)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Policy acceptances (total)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{acceptanceCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Disputes / incidents</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.disputeCount} / {snapshot.incidentCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Enforcements (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{enforcementCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Open financial risk flags</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{riskFlags.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Active crisis events</h2>
          {crisis.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No active crisis events.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {crisis.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-700 px-4 py-3">
                  <span className="font-medium text-slate-200">{c.title}</span>
                  <span className="ml-2 text-xs text-amber-400">{c.severity}</span>
                  {c.region && <span className="ml-2 text-xs text-slate-500">{c.region}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Pending approvals</h2>
          {approvals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pending approval requests.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {approvals.map((a) => (
                <li key={a.id} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
                  {a.requestType} – {a.targetType}:{a.targetId ?? "—"} (by {a.requestedBy})
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Pending appeals</h2>
          {appeals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pending appeals.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {appeals.map((a) => (
                <li key={a.id} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
                  User {a.userId} – {a.description.slice(0, 80)}…
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
