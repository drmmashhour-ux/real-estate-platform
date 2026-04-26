import Link from "next/link";
import { getActiveAiAlerts } from "@/lib/ai-marketplace-health";
import { getAiDecisionLogs } from "@/lib/ai-decision-log";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function AiMonitoringDashboardPage() {
  const [alerts, fraudDecisions, recentFraudScores, recentPricingRecs] = await Promise.all([
    getActiveAiAlerts(20),
    getAiDecisionLogs({ modelKey: "fraud", limit: 20 }),
    prisma.fraudScore.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, entityType: true, entityId: true, score: true, priority: true, createdAt: true },
    }),
    prisma.aiPricingRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, listingId: true, recommendedCents: true, demandLevel: true, createdAt: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            AI Platform Manager
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            AI Monitoring Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            AI alerts, fraud detection events, pricing suggestions, and listing quality.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin/ai" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              AI Control Center
            </Link>
            <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">AI Alerts</h2>
          <p className="mt-1 text-xs text-slate-500">
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

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Fraud detection events</h2>
          <p className="mt-1 text-xs text-slate-500">Recent fraud scores and decisions</p>
          {recentFraudScores.length === 0 && fraudDecisions.logs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No fraud events yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFraudScores.slice(0, 10).map((f) => (
                    <tr key={f.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-300">
                        {f.entityType}:{f.entityId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{f.score.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400">{f.priority ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(f.createdAt).toISOString().slice(0, 19)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Pricing suggestions</h2>
          <p className="mt-1 text-xs text-slate-500">Recent AI pricing recommendations</p>
          {recentPricingRecs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pricing suggestions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Listing</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Recommended</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Demand</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPricingRecs.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-300">{p.listingId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        ${(p.recommendedCents / 100).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{p.demandLevel}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(p.createdAt).toISOString().slice(0, 19)}
                      </td>
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
          <h2 className="text-lg font-semibold text-slate-200">Listing quality</h2>
          <p className="mt-1 text-xs text-slate-500">
            Run <code className="rounded bg-slate-800 px-1 py-0.5">POST /api/ai/listing-quality</code> with listing
            title, description, amenities, photos to get quality score and improvements. Results can be stored when
            implemented.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Use the AI Manager job &quot;daily-listing-analysis&quot; (when LISTINGS_SERVICE_URL is set) to batch
            analyze listings.
          </p>
        </div>
      </section>
    </main>
  );
}
