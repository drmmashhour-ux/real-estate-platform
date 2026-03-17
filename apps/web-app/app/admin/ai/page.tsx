import Link from "next/link";
import { ensureAiModels, listAiModels } from "@/lib/ai-models";
import { getActiveAiAlerts } from "@/lib/ai-marketplace-health";
import { getAiDecisionLogs } from "@/lib/ai-decision-log";
import {
  getFraudDecisionCounts,
  getModelVersionMetrics,
  getPricingRecommendationStats,
} from "@/lib/ai-monitoring";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AiControlCenterPage() {
  await ensureAiModels();
  const [models, alerts, decisions, fraudCounts, versionMetrics, pricingStats] = await Promise.all([
    listAiModels(),
    getActiveAiAlerts(10),
    getAiDecisionLogs({ limit: 15 }),
    getFraudDecisionCounts(),
    getModelVersionMetrics(),
    getPricingRecommendationStats(),
  ]);
  const fraudScoresCount = await prisma.fraudScore.count();
  const pricingRecsCount = await prisma.aiPricingRecommendation.count();
  const demandForecastsCount = await prisma.demandForecast.count();

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            AI Control Center
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            AI Operating System
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Fraud detection, pricing, ranking, demand forecasting, alerts, and decision audit.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin/ai-operator" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              AI Operator Dashboard
            </Link>
            <Link href="/admin/ai-monitoring" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              AI Monitoring
            </Link>
            <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Model registry</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="font-medium text-slate-200">{m.name}</p>
                <p className="text-xs text-slate-500">{m.key}</p>
                {m.versions[0] && (
                  <p className="mt-2 text-xs text-slate-400">v{m.versions[0].version}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">AI outputs (counts)</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2">
              <span className="text-slate-400">Fraud scores:</span>{" "}
              <span className="font-semibold text-slate-100">{fraudScoresCount}</span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2">
              <span className="text-slate-400">Pricing recommendations:</span>{" "}
              <span className="font-semibold text-slate-100">{pricingRecsCount}</span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2">
              <span className="text-slate-400">Demand forecasts:</span>{" "}
              <span className="font-semibold text-slate-100">{demandForecastsCount}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">AI model monitoring</h2>
          <p className="mt-1 text-xs text-slate-500">Fraud detection results, model accuracy, pricing recommendation success</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium text-slate-500">Fraud decisions</p>
              {fraudCounts.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No decisions yet</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {fraudCounts.map((c) => (
                    <li key={c.decision}>{c.decision}: {c.count}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium text-slate-500">Model version metrics</p>
              {versionMetrics.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">No metrics stored</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {versionMetrics.slice(0, 5).map((v, i) => (
                    <li key={i}>{v.modelKey} v{v.version}: {v.metrics ? JSON.stringify(v.metrics) : "—"}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium text-slate-500">Pricing recommendations</p>
              <p className="mt-1 text-sm text-slate-300">Total: {pricingStats.total} · Last 30 days: {pricingStats.last30Days}</p>
              {pricingStats.byDemandLevel.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  By demand: {pricingStats.byDemandLevel.map((d) => `${d.demandLevel}=${d.count}`).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Active AI alerts</h2>
          <p className="text-xs text-slate-500 mt-1">
            GET /api/admin/ai/alerts?run=true to run health checks
          </p>
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No active alerts.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 px-3 py-2"
                >
                  <div>
                    <span className="text-xs font-medium text-amber-400">{a.alertType}</span>
                    <p className="text-sm text-slate-300">{a.title}</p>
                  </div>
                  <span className="text-xs text-slate-500">{a.severity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Recent AI decision log</h2>
          <p className="text-xs text-slate-500 mt-1">Audit trail for model-driven decisions</p>
          {decisions.logs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No decisions logged yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Model</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Decision</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.logs.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-300">{d.model.key}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {d.entityType}:{d.entityId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{d.decision}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {d.score != null ? d.score.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(d.createdAt).toISOString().slice(0, 19)}
                      </td>
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
