import { AdminSecurityOperations } from "@/components/admin/AdminSecurityOperations";
import { SecurityFailureBarChart } from "@/components/admin/SecurityFailureBarChart";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@repo/db";
import { getActiveAlerts, getPlatformHealthSnapshot } from "@/lib/observability";
import { listSecurityIpBlocks } from "@/lib/security/ip-block";
import { getLoginFailureHourlySeries, getTopFailedLoginFingerprints } from "@/lib/security/security-analytics";
import { getSecurityDashboardSummary } from "@/lib/security/security-dashboard";
import { securityHardeningV1Flags } from "@/config/feature-flags";
import { verifyRlsPoliciesAndAppLayerExpectations } from "@/modules/security/rls-enforcer.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSecurityPage() {
  await requireAdminControlUserId();

  const [
    events,
    alerts,
    riskAlerts,
    summary,
    hourlyFailures,
    topFingerprints,
    blocks,
    health,
  ] = await Promise.all([
    prisma.platformEvent.findMany({
      where: {
        OR: [
          { sourceModule: "security" },
          { eventType: { startsWith: "security_" } },
          { eventType: { startsWith: "auth_" } },
          { eventType: { contains: "webhook", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        eventType: true,
        sourceModule: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        processingStatus: true,
        errorMessage: true,
      },
    }),
    getActiveAlerts(30),
    getAdminRiskAlerts(),
    getSecurityDashboardSummary(prisma),
    getLoginFailureHourlySeries(prisma, 24),
    getTopFailedLoginFingerprints(prisma, 24, 12),
    listSecurityIpBlocks(30),
    getPlatformHealthSnapshot(),
  ]);

  const rlsSnapshot = await verifyRlsPoliciesAndAppLayerExpectations().catch(() => null);
  const hardeningEvents = securityHardeningV1Flags.securityLoggingV1
    ? await prisma.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      })
    : [];

  const scanNote =
    process.env.SECURITY_LAST_SCAN_SUMMARY?.trim() ||
    "Automated scans: GitHub Actions (CodeQL, Snyk, ZAP). Set SECURITY_LAST_SCAN_SUMMARY in Vercel to show last run notes for this dashboard.";

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Security overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Post-launch monitoring: platform events, automated alerts, and response tools. See repository doc{" "}
            <code className="text-zinc-400">docs/security/post-launch-monitoring.md</code>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{summary.windowLabel}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary.failedLogins}</p>
            <p className="text-xs text-zinc-500">Failed logins (vs prior {summary.failedLoginsPrev})</p>
            <p className="mt-2 text-xs text-zinc-400">Attempts: {summary.loginAttempts}</p>
            {summary.loginFailureSpike ? (
              <p className="mt-2 text-xs text-amber-300">Elevated vs prior window — investigate.</p>
            ) : null}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Signups & abuse</p>
            <p className="mt-1 text-sm text-zinc-200">
              Signup attempts: <span className="font-mono text-emerald-300">{summary.signupAttempts}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Signup bursts: <span className="font-mono text-emerald-300">{summary.signupAbuse}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Messaging spam signals:{" "}
              <span className="font-mono text-emerald-300">{summary.messagingSpam}</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Webhooks & payments</p>
            <p className="mt-1 text-sm text-zinc-200">
              Webhook sig failures:{" "}
              <span className="font-mono text-emerald-300">{summary.webhookSignatureFailures}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Webhook processing failed:{" "}
              <span className="font-mono text-emerald-300">{summary.webhookProcessingFailures}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Payment failed events: <span className="font-mono text-emerald-300">{summary.paymentFailures}</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Limits & access</p>
            <p className="mt-1 text-sm text-zinc-200">
              Rate limits (persisted):{" "}
              <span className="font-mono text-emerald-300">{summary.rateLimitPersisted}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Permission denials: <span className="font-mono text-emerald-300">{summary.permissionDenials}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Suspicious admin attempts:{" "}
              <span className="font-mono text-emerald-300">{summary.suspiciousAdminAccess}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Admin-tagged events: <span className="font-mono text-emerald-300">{summary.adminEvents}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <h2 className="text-lg font-semibold text-white">Failed logins (24h)</h2>
            <p className="mt-1 text-xs text-zinc-500">Hourly buckets from platform_events</p>
            <div className="mt-3">
              <SecurityFailureBarChart series={hourlyFailures} />
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <h2 className="text-lg font-semibold text-white">Suspicious fingerprints</h2>
            <p className="mt-1 text-xs text-zinc-500">Top sources of auth_login_failure (24h)</p>
            <ul className="mt-3 space-y-2 font-mono text-xs text-zinc-300">
              {topFingerprints.length === 0 ? (
                <li className="text-zinc-500">No data.</li>
              ) : (
                topFingerprints.map((r) => (
                  <li key={r.fingerprint} className="flex justify-between gap-2 border-b border-zinc-800/60 pb-2">
                    <span className="truncate text-emerald-400/90" title={r.fingerprint}>
                      {r.label}
                    </span>
                    <span className="text-zinc-500">{r.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <h2 className="text-lg font-semibold text-white">System health (24h snapshot)</h2>
            <ul className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
              <li>Bookings: {health.bookingsCreated}</li>
              <li>Payments completed: {health.paymentsCompleted}</li>
              <li>Payments failed: {health.paymentsFailed}</li>
              <li>Disputes: {health.disputesCreated}</li>
              <li>Fraud signals: {health.fraudSignalsCreated}</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-600">
              API/traffic spikes: use Vercel Observability and log drains (see post-launch doc).
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <h2 className="text-lg font-semibold text-white">Active IP blocks</h2>
            <p className="mt-1 text-xs text-zinc-500">Database denylist + auto-blocks from security monitor</p>
            <ul className="mt-3 max-h-48 overflow-auto font-mono text-[11px] text-zinc-400">
              {blocks.length === 0 ? (
                <li>None.</li>
              ) : (
                blocks.map((b) => (
                  <li key={b.id} className="border-b border-zinc-800/50 py-1">
                    <span className="text-emerald-500/90">{b.ipFingerprint.slice(0, 12)}…</span>
                    {b.expiresAt ? <span className="text-zinc-600"> · until {b.expiresAt.toISOString()}</span> : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-4 text-sm text-emerald-100/90">
          <p className="font-semibold text-emerald-200">Automation</p>
          <p className="mt-2 text-xs leading-relaxed text-emerald-100/80">
            Schedule <code className="text-emerald-300/90">POST /api/cron/security-monitor</code> with{" "}
            <code className="text-emerald-300/90">Authorization: Bearer $CRON_SECRET</code> (e.g. every 15–60 minutes).
            It evaluates thresholds, opens <code className="text-emerald-300/90">SystemAlert</code> rows, and may
            auto-block IPs after extreme failed-login bursts. Existing routes already apply distributed rate limits and
            optional Redis IP cooldown (<code className="text-emerald-300/90">RATE_LIMIT_IP_BLOCK</code>).
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-100/90">
          <p className="font-semibold text-amber-200">Kill switches (Vercel → Production env)</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs text-amber-100/80">
            <li>PLATFORM_DISABLE_PUBLIC_SIGNUP=1</li>
            <li>PLATFORM_DISABLE_PUBLIC_CONTACT_FORMS=1</li>
            <li>PLATFORM_DISABLE_AI_CONTENT_GENERATION=1</li>
            <li>PLATFORM_DISABLE_SENSITIVE_AUTOMATIONS=1</li>
            <li>PLATFORM_MAINTENANCE_MESSAGE=… (optional user-facing text)</li>
          </ul>
        </div>

        <AdminSecurityOperations />

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <h2 className="text-lg font-semibold text-white">Latest security scans</h2>
          <p className="mt-2 text-sm text-zinc-300">{scanNote}</p>
        </div>

        {summary.notes.length > 0 ? (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-3 text-sm text-amber-100/90">
            <p className="font-semibold text-amber-200">Signals</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {summary.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {alerts.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-white">Unresolved system alerts</h2>
            <ul className="mt-2 space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-100/90"
                >
                  <span className="font-mono text-xs text-red-300">{a.severity}</span> · {a.message}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No unresolved system alerts.</p>
        )}

        {rlsSnapshot ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <h2 className="text-lg font-semibold text-white">RLS policy check (Postgres)</h2>
            <p className="mt-1 text-xs text-zinc-500">{rlsSnapshot.message}</p>
            <p className="mt-2 text-sm text-zinc-400">
              Status: <span className="font-mono text-emerald-300/90">{rlsSnapshot.status}</span> — app server uses a
              privileged DB role; enforce tenant isolation in API routes.
            </p>
          </div>
        ) : null}

        {securityHardeningV1Flags.securityLoggingV1 ? (
          <div>
            <h2 className="text-lg font-semibold text-white">Security hardening events (v1)</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Rows from <code className="text-zinc-400">security_events</code> — middleware blocks + API audit hooks.
            </p>
            {hardeningEvents.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No audit rows yet — blocked requests can be logged here when wired.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900/80 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">IP</th>
                      <th className="px-3 py-2">Path</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-[#111]">
                    {hardeningEvents.map((e: (typeof hardeningEvents)[number]) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{e.createdAt.toISOString()}</td>
                        <td className="px-3 py-2 font-mono text-amber-200/90">{e.type}</td>
                        <td className="px-3 py-2">{e.severity}</td>
                        <td className="px-3 py-2 font-mono text-zinc-500">{e.ip ?? "—"}</td>
                        <td className="max-w-[240px] truncate px-3 py-2 text-zinc-500">{e.path ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold text-white">Recent security & auth events</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Sourced from <code className="text-zinc-400">platform_events</code>. For full-text search use the tool
            above or Vercel log drains.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-[#111]">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{e.createdAt.toISOString()}</td>
                    <td className="px-3 py-2 font-mono text-emerald-300/90">{e.eventType}</td>
                    <td className="px-3 py-2">{e.sourceModule}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-zinc-500">
                      {e.entityType}:{e.entityId}
                    </td>
                    <td className="px-3 py-2">{e.processingStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 ? (
              <p className="p-4 text-center text-zinc-500">No matching rows yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </LecipmControlShell>
  );
}
