import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TrustgraphQueueQuickActions } from "@/components/trust/TrustgraphQueueQuickActions";

import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadVerificationQueue, loadVerificationQueueStats } from "@/lib/trustgraph/application/loadVerificationQueue";
import { isTrustGraphAdminQueueEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { queueQuerySchema } from "@/lib/trustgraph/infrastructure/validation/queueQuerySchema";
import { CaseStatusBadge } from "@/lib/trustgraph/ui/components/CaseStatusBadge";
import { ReadinessBadge } from "@/lib/trustgraph/ui/components/ReadinessBadge";
import { SeverityBadge } from "@/lib/trustgraph/ui/components/SeverityBadge";
import { TrustBadge } from "@/lib/trustgraph/ui/components/TrustBadge";

export const dynamic = "force-dynamic";

function parseQueueSearchParams(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v) ? (v[0] ?? "") : v;
  }
  return out;
}

export default async function AdminTrustGraphQueuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/trustgraph");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const enabled = isTrustGraphEnabled();
  const queueEnabled = isTrustGraphAdminQueueEnabled();
  const role = await getUserRole();

  const rawSp = parseQueueSearchParams((await searchParams) ?? {});
  const parsedQ = queueQuerySchema.safeParse(rawSp);
  const q = parsedQ.success ? parsedQ.data : queueQuerySchema.parse({});

  const stats =
    enabled && queueEnabled
      ? await loadVerificationQueueStats().catch(() => ({
          totalOpen: 0,
          criticalHigh: 0,
          pendingReview: 0,
          recentlyUpdated: 0,
        }))
      : null;

  const queueData = enabled && queueEnabled ? await loadVerificationQueue(q).catch(() => null) : null;

  const totalPages =
    queueData && queueData.pageSize > 0 ? Math.max(1, Math.ceil(queueData.total / queueData.pageSize)) : 1;

  const mkHref = (patch: Record<string, string | number | undefined>) => {
    const next = { ...rawSp, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? "" : String(v)])) };
    const qs = new URLSearchParams(next).toString();
    return `/admin/trustgraph${qs ? `?${qs}` : ""}`;
  };

  return (
    <HubLayout
      title="TrustGraph Autopilot"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Admin · Compliance"
          title="TrustGraph operations"
          subtitle="Rules-first verification with traceable signals, rule results, and human review. Internal tools only — not exposed to partners."
          action={
            <Link
              href="/admin/analytics/tools"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-premium-gold/40 hover:text-white"
            >
              Analytics
            </Link>
          }
        />
        <div>
          <h2 className="text-lg font-semibold text-white">Review queue</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Enable with <code className="text-slate-300">TRUSTGRAPH_ENABLED=true</code>; the admin queue uses{" "}
            <code className="text-slate-300">TRUSTGRAPH_ADMIN_QUEUE_ENABLED</code> (defaults on when the master flag is on).
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">SLA status</p>
            <p className="mt-2 text-sm text-slate-300">Configure targets in workspace settings (enterprise).</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">Fraud alerts</p>
            <p className="mt-2 text-sm text-slate-300">Use critical / high signal counts below — internal review only.</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">Audit trail</p>
            <p className="mt-2 text-sm text-slate-300">Case history and exports live on each case detail page.</p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">Partner API</p>
            <p className="mt-2 text-sm text-slate-300">External access is scoped, rate-limited, and sanitized.</p>
          </Card>
        </div>

        {!enabled ? (
          <p className="rounded-xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
            TrustGraph is disabled. Set TRUSTGRAPH_ENABLED=true to create and run cases.
          </p>
        ) : !queueEnabled ? (
          <p className="rounded-xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
            Admin queue is disabled. Ensure TRUSTGRAPH_ENABLED=true and TRUSTGRAPH_ADMIN_QUEUE_ENABLED is not set to false.
          </p>
        ) : (
          <>
            {stats ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card hoverable className="p-4">
                  <p className="text-xs uppercase text-slate-500">Open cases</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{stats.totalOpen}</p>
                </Card>
                <Card hoverable className="p-4">
                  <p className="text-xs uppercase text-slate-500">Critical / high signals</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-100">{stats.criticalHigh}</p>
                </Card>
                <Card hoverable className="p-4">
                  <p className="text-xs uppercase text-slate-500">Pending review</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-100">{stats.pendingReview}</p>
                </Card>
                <Card hoverable className="p-4">
                  <p className="text-xs uppercase text-slate-500">Updated (24h)</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-100">{stats.recentlyUpdated}</p>
                </Card>
              </div>
            ) : null}

            <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <label className="text-xs text-slate-400">
                Status
                <select
                  name="status"
                  defaultValue={rawSp.status ?? ""}
                  className="ml-2 mt-1 block rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Any</option>
                  {["pending", "in_review", "approved", "rejected", "needs_info", "escalated"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Entity
                <select
                  name="entityType"
                  defaultValue={rawSp.entityType ?? ""}
                  className="ml-2 mt-1 block rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Any</option>
                  {["LISTING", "SELLER_DECLARATION", "BROKER"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Trust
                <select
                  name="trustLevel"
                  defaultValue={rawSp.trustLevel ?? ""}
                  className="ml-2 mt-1 block rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Any</option>
                  {["low", "medium", "high", "verified"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Readiness
                <select
                  name="readinessLevel"
                  defaultValue={rawSp.readinessLevel ?? ""}
                  className="ml-2 mt-1 block rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Any</option>
                  {["not_ready", "partial", "ready", "action_required"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Severity
                <select
                  name="severity"
                  defaultValue={rawSp.severity ?? ""}
                  className="ml-2 mt-1 block rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="">Any</option>
                  {["critical", "high", "medium", "low", "info"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Search
                <input
                  name="search"
                  defaultValue={rawSp.search ?? ""}
                  placeholder="entity id / case UUID"
                  className="ml-2 mt-1 block w-48 rounded border border-white/15 bg-slate-900 px-2 py-1 text-sm text-white"
                />
              </label>
              <input type="hidden" name="pageSize" value={String(q.pageSize)} />
              <button
                type="submit"
                className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-1.5 text-sm text-premium-gold hover:bg-premium-gold/20"
              >
                Apply filters
              </button>
            </form>

            {!queueData || queueData.items.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
                No verification cases match these filters.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Case</th>
                      <th className="px-3 py-2">Entity</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Trust</th>
                      <th className="px-3 py-2">Readiness</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Updated</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueData.items.map((c) => (
                      <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2 font-mono text-xs text-premium-gold">
                          <Link href={`/admin/trustgraph/cases/${c.id}`} className="hover:underline">
                            {c.id.slice(0, 8)}…
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          {c.entityType} · <span className="font-mono text-xs">{c.entityId.slice(0, 8)}…</span>
                        </td>
                        <td className="px-3 py-2">
                          <CaseStatusBadge status={c.status} />
                        </td>
                        <td className="px-3 py-2">{c.overallScore ?? "—"}</td>
                        <td className="px-3 py-2">
                          <TrustBadge level={c.trustLevel} />
                        </td>
                        <td className="px-3 py-2">
                          <ReadinessBadge level={c.readinessLevel} />
                        </td>
                        <td className="px-3 py-2">
                          <SeverityBadge severity={c.topSeverity} />
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(c.updatedAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <Link href={`/admin/trustgraph/cases/${c.id}`} className="text-[11px] text-premium-gold hover:underline">
                              Open
                            </Link>
                            <TrustgraphQueueQuickActions caseId={c.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {queueData && totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>
                  Page {queueData.page} of {totalPages} ({queueData.total} total)
                </span>
                {queueData.page > 1 ? (
                  <Link
                    href={mkHref({ page: queueData.page - 1 })}
                    className="rounded border border-white/15 px-2 py-1 text-slate-200 hover:bg-white/5"
                  >
                    Previous
                  </Link>
                ) : null}
                {queueData.page < totalPages ? (
                  <Link
                    href={mkHref({ page: queueData.page + 1 })}
                    className="rounded border border-white/15 px-2 py-1 text-slate-200 hover:bg-white/5"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        <Link href="/admin/dashboard" className="text-sm text-premium-gold hover:underline">
          ← Admin dashboard
        </Link>
      </div>
    </HubLayout>
  );
}
