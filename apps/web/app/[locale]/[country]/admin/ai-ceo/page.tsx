import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getCeoDashboardPayload } from "@/src/modules/ai/ceoDashboardPayload";

export const dynamic = "force-dynamic";

type StoredAction = {
  id?: string;
  type?: string;
  priority?: number;
  rationale?: string;
};

type StoredExecution = {
  actionId?: string;
  type?: string;
  ok?: boolean;
  detail?: string;
};

export default async function AdminAiCeoPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/ai-ceo");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();

  let payload: Awaited<ReturnType<typeof getCeoDashboardPayload>> | null = null;
  try {
    payload = await getCeoDashboardPayload();
  } catch {
    payload = null;
  }

  const latest = payload?.runs[0];
  const latestMetrics = latest?.metricsSnapshot as Record<string, unknown> | undefined;
  const latestActions = (latest?.proposedActions as StoredAction[] | undefined) ?? [];
  const latestExec = (latest?.executionLog as StoredExecution[] | undefined) ?? [];
  const latestOps = (latest?.opsAlerts as { severity?: string; code?: string; message?: string }[] | undefined) ?? [];

  return (
    <HubLayout title="AI CEO" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-10">
        <div>
          <h1 className="text-xl font-semibold text-white">AI CEO command deck</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Autonomous loop: <code className="text-slate-300">analyzeMetrics</code> →{" "}
            <code className="text-slate-300">generateActions</code> →{" "}
            <code className="text-slate-300">executeActions</code> (cron{" "}
            <code className="text-slate-300">POST /api/cron/ai-ceo-daily</code>). Pairs with{" "}
            <Link href="/admin/intelligence" className="text-premium-gold hover:underline">
              intelligence
            </Link>{" "}
            and autopilot crons.
          </p>
        </div>

        {payload ? (
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Marketing engagement (AI CEO posts)</h2>
            <p className="mt-1 text-xs text-slate-600">Proxy from autopilot metadata (LinkedIn sweep outcomes).</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">CEO posts</p>
                <p className="mt-1 text-2xl font-semibold text-white">{payload.engagement.ceoPosts}</p>
              </div>
              <div className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Posted (sweep)</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">{payload.engagement.posted}</p>
              </div>
              <div className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Failed (sweep)</p>
                <p className="mt-1 text-2xl font-semibold text-rose-300">{payload.engagement.failed}</p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Latest AI decisions</h2>
            {!latest ? (
              <p className="mt-4 text-sm text-slate-500">
                No persisted runs yet. Apply migration <code className="text-slate-400">ai_ceo_daily_runs</code> and run cron.
              </p>
            ) : (
              <>
                <p className="mt-2 text-xs text-slate-600">
                  Run <span className="font-mono text-slate-400">{latest.id}</span> · {latest.status} ·{" "}
                  {new Date(latest.createdAt).toLocaleString()}
                </p>
                {latestMetrics ? (
                  <ul className="mt-4 space-y-1 text-sm text-slate-300">
                    <li>Leads 7d: {String(latestMetrics.leadsLast7d ?? "—")}</li>
                    <li>Lead Δ%: {String(latestMetrics.leadDeltaPct ?? "—")}</li>
                    <li>Listing views 7d: {String(latestMetrics.listingViews7d ?? "—")}</li>
                    <li>Payments success 7d: {String(latestMetrics.paymentsSuccess7d ?? "—")}</li>
                  </ul>
                ) : null}
                <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
                  {latestActions.map((a, i) => (
                    <li key={a.id ?? i} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                      <span className="font-mono text-premium-gold">{a.type}</span>{" "}
                      <span className="text-slate-500">p{a.priority}</span>
                      <p className="mt-1 text-slate-400">{a.rationale}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Actions executed</h2>
            {!latestExec.length ? (
              <p className="mt-4 text-sm text-slate-500">No execution log on latest row.</p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
                {latestExec.map((e, i) => (
                  <li
                    key={e.actionId ?? i}
                    className={`rounded-lg border px-3 py-2 ${e.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}
                  >
                    <span className="font-mono text-slate-200">{e.type}</span>{" "}
                    <span className={e.ok ? "text-emerald-400" : "text-rose-400"}>{e.ok ? "ok" : "fail"}</span>
                    {e.detail ? <p className="mt-1 text-xs text-slate-500">{e.detail}</p> : null}
                  </li>
                ))}
              </ul>
            )}
            {latestOps.length > 0 ? (
              <div className="mt-6 border-t border-white/10 pt-4">
                <h3 className="text-xs font-semibold uppercase text-slate-500">Ops alerts (latest run)</h3>
                <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
                  {latestOps.map((o, i) => (
                    <li key={i}>
                      [{o.severity}] {o.code}: {o.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        {payload ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Growth trends</h2>
              <h3 className="mt-4 text-xs uppercase text-slate-600">Top listings (views)</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {payload.topListings.map((l) => (
                  <li key={l.listingId} className="flex justify-between gap-2">
                    <span className="truncate">{l.listingCode ?? l.listingId}</span>
                    <span className="text-white">{l.views}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs uppercase text-slate-600">Channels</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {payload.channels.map((c) => (
                  <li key={c.channel} className="flex justify-between gap-2">
                    <span>{c.channel}</span>
                    <span className="text-white">{c.leads}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Revenue insights</h2>
              <h3 className="mt-4 text-xs uppercase text-slate-600">Dynamic pricing hints</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {payload.revenueHints.map((h) => (
                  <li key={h.listingId} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <p className="font-mono text-xs text-premium-gold">{h.listingCode ?? h.listingId}</p>
                    <p className="text-slate-400">
                      ${(h.nightPriceCents / 100).toFixed(0)}/night → ${(h.suggestedNightPriceCents / 100).toFixed(0)}{" "}
                      suggested
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{h.rationale}</p>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs uppercase text-slate-600">Premium plays</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                {payload.premiumRecs.map((p) => (
                  <li key={p.product}>
                    <span className="text-slate-200">{p.product}</span> — {p.rationale}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {payload && payload.runs.length > 1 ? (
          <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recent runs</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {payload.runs.slice(1, 8).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 border-b border-white/5 py-2 last:border-0">
                  <span className="font-mono text-xs text-slate-500">{r.id.slice(0, 8)}…</span>
                  <span className="text-slate-300">{r.status}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </HubLayout>
  );
}
