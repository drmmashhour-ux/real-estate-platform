import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AiOperatorDashboardPage() {
  const [decisions, alerts] = await Promise.all([
    prisma.aiOperatorDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.aiOperatorAlert.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            AI Marketplace Operator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Operator Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Decisions, alerts, and human override. Start the operator service and set AI_OPERATOR_URL to use agents.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin/ai" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              AI Control Center
            </Link>
            <Link href="/admin/ai-monitoring" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              AI Monitoring
            </Link>
            <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">AI Operator Alerts (open)</h2>
          <p className="mt-1 text-xs text-slate-500">Alerts created by the operator for review</p>
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No open alerts.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Severity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Message</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-300">{a.alertType}</td>
                      <td className="px-4 py-3 text-slate-400">{a.severity}</td>
                      <td className="px-4 py-3 text-slate-400">{a.entityType}:{a.entityId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-300">{a.message.slice(0, 60)}…</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(a.createdAt).toISOString().slice(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Decision log</h2>
          <p className="mt-1 text-xs text-slate-500">Override via POST /api/ai-operator/decisions/[id]/override</p>
          {decisions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No decisions yet. Call operator endpoints to generate decisions.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Agent</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Action</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Confidence</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Override</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-300">{d.agentType}</td>
                      <td className="px-4 py-3 text-slate-400">{d.entityType}:{d.entityId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-300">{d.recommendedAction}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{(d.confidenceScore * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-slate-500">
                        {d.humanOverrideBy ? `By ${d.humanOverrideBy} → ${d.humanOverrideAction}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toISOString().slice(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
