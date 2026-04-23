import Link from "next/link";
import { prisma } from "@repo/db";
import { getStorageAnalytics } from "@/lib/storage/analytics";
import { getOptimizationRecommendations } from "@/lib/storage/ai-optimizer";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + "GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + "KB";
  return bytes + "B";
}

export default async function AdminStoragePage() {
  let analytics: Awaited<ReturnType<typeof getStorageAnalytics>> | null = null;
  let recommendations: Awaited<ReturnType<typeof getOptimizationRecommendations>> = [];
  let nearLimitUsers: { userId: string; usedBytes: number; limitBytes: number; alertLevel: string }[] = [];

  try {
    [analytics, recommendations, nearLimitUsers] = await Promise.all([
      getStorageAnalytics(),
      getOptimizationRecommendations(),
      prisma.userStorage.findMany({
        where: { alertLevel: { in: ["warning", "critical", "full"] } },
        select: { userId: true, usedBytes: true, limitBytes: true, alertLevel: true },
      }),
    ]);
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to Admin
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Storage &amp; optimization</h1>
          <p className="mt-1 text-sm text-slate-400">
            Platform-wide analytics, compression savings, retention, and AI recommendations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Total storage used</p>
            <p className="text-xl font-semibold text-slate-100">
              {analytics ? formatBytes(analytics.totalUsedBytes) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Total files</p>
            <p className="text-xl font-semibold text-slate-100">
              {analytics ? analytics.fileCountsByType.reduce((s, x) => s + x.count, 0) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Storage growth</p>
            <p className="text-xl font-semibold text-slate-100">
              {analytics ? formatBytes(analytics.monthlyGrowthBytes) : "—"}
            </p>
            {analytics?.monthlyGrowthPercent != null && (
              <p className="text-xs text-slate-400">{analytics.monthlyGrowthPercent}% vs last month</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Compression savings</p>
            <p className="text-xl font-semibold text-emerald-400">
              {analytics ? formatBytes(analytics.compressionSavingsBytes) : "—"}
            </p>
            {analytics?.compressionSavingsPercent != null && analytics.compressionSavingsPercent > 0 && (
              <p className="text-xs text-slate-400">{analytics.compressionSavingsPercent}%</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Near-limit users</p>
            <p className="text-xl font-semibold text-amber-400">{nearLimitUsers.length}</p>
          </div>
        </div>

        {analytics && analytics.topConsumers.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-slate-200">Top 10 users by usage</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 text-left font-medium text-slate-400">#</th>
                    <th className="py-2 text-left font-medium text-slate-400">User ID</th>
                    <th className="py-2 text-right font-medium text-slate-400">Used</th>
                    <th className="py-2 text-right font-medium text-slate-400">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topConsumers.slice(0, 10).map((u, i) => (
                    <tr key={u.userId} className="border-b border-slate-800">
                      <td className="py-2 text-slate-400">{i + 1}</td>
                      <td className="py-2 font-mono text-xs text-slate-300">{u.userId}</td>
                      <td className="py-2 text-right text-slate-300">{formatBytes(u.usedBytes)}</td>
                      <td className="py-2 text-right text-slate-400">{u.fileCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-violet-500/40 bg-violet-950/20 p-4">
          <h2 className="text-lg font-semibold text-violet-200">🧠 AI Panel</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Users near limit</p>
              <p className="text-xl font-semibold text-amber-400">{nearLimitUsers.length}</p>
              <p className="text-xs text-slate-400">Warning / critical / full</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Storage risk users</p>
              <p className="text-xl font-semibold text-red-400">
                {nearLimitUsers.filter((u) => u.alertLevel === "full" || u.alertLevel === "critical").length}
              </p>
              <p className="text-xs text-slate-400">Critical or full — uploads blocked or soon</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Revenue opportunity</p>
              <p className="text-xl font-semibold text-emerald-400">
                {nearLimitUsers.length > 0
                  ? `$${nearLimitUsers.length * 5}/mo potential`
                  : "—"}
              </p>
              <p className="text-xs text-slate-400">Upsell to Basic/Pro (e.g. $5/mo per user)</p>
            </div>
          </div>
        </div>

        {nearLimitUsers.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
            <h2 className="text-lg font-semibold text-amber-200">Near-limit users</h2>
            <p className="text-sm text-slate-400">Users at warning/critical/full. Consider outreach or plan upsell.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 text-left font-medium text-slate-400">User ID</th>
                    <th className="py-2 text-right font-medium text-slate-400">Used</th>
                    <th className="py-2 text-right font-medium text-slate-400">Limit</th>
                    <th className="py-2 text-left font-medium text-slate-400">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {nearLimitUsers.map((u) => (
                    <tr key={u.userId} className="border-b border-slate-800">
                      <td className="py-2 font-mono text-xs text-slate-300">{u.userId}</td>
                      <td className="py-2 text-right text-slate-300">{formatBytes(u.usedBytes)}</td>
                      <td className="py-2 text-right text-slate-400">{formatBytes(u.limitBytes)}</td>
                      <td className="py-2">
                        <span
                          className={
                            u.alertLevel === "full"
                              ? "text-red-400"
                              : u.alertLevel === "critical"
                                ? "text-amber-400"
                                : "text-amber-300"
                          }
                        >
                          {u.alertLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-slate-200">Recommendations &amp; alerts</h2>
            <ul className="mt-2 space-y-2">
              {recommendations.map((r) => (
                <li key={r.id} className="text-sm text-slate-300">
                  <span className={r.priority === "critical" ? "text-red-400" : r.priority === "high" ? "text-amber-400" : ""}>
                    {r.title}
                  </span>
                  — {r.description}
                  {r.impactBytes != null && r.impactBytes > 0 && (
                    <span className="text-slate-500"> (save {formatBytes(r.impactBytes)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-slate-200">Safety rules</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-400">
            <li>All deletions and restores are logged in StorageAuditLog.</li>
            <li>Permanent delete only after 30-day trash retention and never for legal/invoice/compliance.</li>
            <li>Restore from trash is available during the retention window.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
