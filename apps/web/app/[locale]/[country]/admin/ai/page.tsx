import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminAIStatus } from "@/lib/admin/control-center";
import { getAdminAiOverview } from "@/lib/admin/getAdminAiOverview";
import { prisma } from "@repo/db";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function AdminAiControlPage() {
  await requireAdminControlUserId();
  const [status, recentErrors, overview, weakIntel, opportunityIntel] = await Promise.all([
    getAdminAIStatus(),
    prisma.bnhubEngineAuditLog.findMany({
      where: {
        OR: [{ decisionType: { contains: "fail" } }, { decisionType: { contains: "error" } }],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, decisionType: true, source: true, createdAt: true },
    }),
    getAdminAiOverview(),
    prisma.listingIntelligenceSnapshot.findMany({
      where: { OR: [{ lowPhotoCount: true }, { weakDescription: true }, { weakTitle: true }] },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { listingId: true, summary: true, createdAt: true, aiCompositeScore: true },
    }),
    prisma.listingIntelligenceSnapshot.findMany({
      where: {
        demandScore: { gte: 0.65 },
        priceCompetitiveness: { gte: 0.72 },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { listingId: true, summary: true, demandScore: true, priceCompetitiveness: true, createdAt: true },
    }),
  ]);

  return (
    <LecipmControlShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">AI control</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Operational toggles reflect deployment env. Use Autonomy for runtime kill switches.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Pricing AI", on: status.toggles.pricingAi },
            { label: "Messaging AI", on: status.toggles.messagingAi },
            { label: "Promo AI", on: status.toggles.promoAi },
            { label: "Listing optimization", on: status.toggles.listingOptimizationAi },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
              <p className="text-xs uppercase text-zinc-500">{t.label}</p>
              <p className="mt-2 text-lg font-semibold" style={{ color: t.on ? GOLD : "#9ca3af" }}>
                {t.on ? "Enabled" : "Off"}
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">Set via LECIPM_AI_* env vars</p>
            </div>
          ))}
        </section>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-4">
          <p className="text-sm font-medium text-amber-200">Autopilot pause: {status.toggles.autopilotPaused ? "ON" : "off"}</p>
          <Link href="/admin/autonomy" className="mt-2 inline-block text-sm text-amber-300/90 underline">
            Open autonomy & kill switches →
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Pending suggestions (DB)</p>
            <p className="mt-2 text-2xl font-bold text-white">{overview.pendingSuggestions}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Pending autopilot actions</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: GOLD }}>
              {overview.pendingActions}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Failed actions (24h)</p>
            <p className="mt-2 text-2xl font-bold text-rose-300">{overview.failedActions24h}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">Unified intelligence — weak content</h2>
            <p className="mt-1 text-xs text-zinc-500">Listings needing photos or copy (latest snapshots).</p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
              {weakIntel.length === 0 ? (
                <li className="text-zinc-500">No snapshot rows yet. Run `pnpm ai:run`.</li>
              ) : (
                weakIntel.map((r) => (
                  <li key={`${r.listingId}-${r.createdAt.toISOString()}`} className="border-b border-zinc-800/80 pb-2 text-zinc-400">
                    <Link href={`/bnhub/stays/${r.listingId}`} className="text-zinc-200 hover:underline">
                      {r.listingId.slice(0, 8)}…
                    </Link>
                    {r.summary ? <span className="block text-[11px] text-zinc-500">{r.summary.slice(0, 120)}</span> : null}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">High demand + value signal</h2>
            <p className="mt-1 text-xs text-zinc-500">Pricing opportunities (heuristic from snapshots).</p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
              {opportunityIntel.length === 0 ? (
                <li className="text-zinc-500">No rows match yet.</li>
              ) : (
                opportunityIntel.map((r) => (
                  <li key={`${r.listingId}-${r.createdAt.toISOString()}`} className="border-b border-zinc-800/80 pb-2 text-zinc-400">
                    <Link href={`/bnhub/stays/${r.listingId}`} className="text-zinc-200 hover:underline">
                      {r.listingId.slice(0, 8)}…
                    </Link>
                    <span className="ml-2 text-[11px] text-zinc-500">
                      demand {r.demandScore?.toFixed(2)} · value {r.priceCompetitiveness?.toFixed(2)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">Recent AI suggestions</h2>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {overview.recentSuggestions.length === 0 ? (
                <li className="text-zinc-500">No rows yet.</li>
              ) : (
                overview.recentSuggestions.map((s) => (
                  <li key={s.id} className="border-b border-zinc-800/80 pb-2 text-zinc-400">
                    <span className="text-zinc-200">{s.title}</span> · {String(s.type)} ·{" "}
                    {s.createdAt.toISOString().slice(0, 16)}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">Autopilot action history</h2>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {overview.recentActions.length === 0 ? (
                <li className="text-zinc-500">No actions yet.</li>
              ) : (
                overview.recentActions.map((a) => (
                  <li key={a.id} className="border-b border-zinc-800/80 pb-2 text-zinc-400">
                    <span className="text-zinc-200">{a.actionType}</span> · {a.status} ·{" "}
                    {a.createdAt.toISOString().slice(0, 16)}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">Suggestion queue (heuristic)</h2>
            <dl className="mt-4 space-y-2 text-sm text-zinc-400">
              <div className="flex justify-between">
                <dt>Pricing signals</dt>
                <dd className="text-white">{status.queuePricing}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Descriptions</dt>
                <dd className="text-white">{status.queueDescriptions}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Completeness</dt>
                <dd className="text-white">{status.queueCompleteness}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Promotions</dt>
                <dd className="text-white">{status.queuePromotions}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-lg font-semibold text-white">24h activity</h2>
            <dl className="mt-4 space-y-2 text-sm text-zinc-400">
              <div className="flex justify-between">
                <dt>Autopilot</dt>
                <dd className="text-white">{status.autopilot24h}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Failures</dt>
                <dd className="text-rose-300">{status.failures24h}</dd>
              </div>
            </dl>
            <Link href="/admin/ai-inbox" className="mt-4 inline-block text-sm" style={{ color: GOLD }}>
              AI inbox →
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Recent engine errors</h2>
          {recentErrors.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No failed AI tasks in recent logs.</p>
          ) : (
            <ul className="mt-3 space-y-2 rounded-2xl border border-zinc-800 bg-[#111] p-4">
              {recentErrors.map((e) => (
                <li key={e.id} className="text-sm text-zinc-400">
                  <span className="text-zinc-200">{e.decisionType}</span> · {e.source} ·{" "}
                  {e.createdAt.toISOString().slice(0, 16)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </LecipmControlShell>
  );
}
