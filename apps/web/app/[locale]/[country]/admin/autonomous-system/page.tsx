import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadAutonomousSystemBriefing } from "@/lib/autonomy/briefing-data";

export const dynamic = "force-dynamic";

export default async function AdminAutonomousSystemPage() {
  let briefing: Awaited<ReturnType<typeof loadAutonomousSystemBriefing>> | null = null;
  let error: string | null = null;
  try {
    briefing = await loadAutonomousSystemBriefing();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load briefing.";
  }

  return (
    <HubLayout title="Autonomous system" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-white">
        <div>
          <h1 className="font-serif text-2xl text-amber-400">BNHub · LECIPM control tower</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            Event-driven automation (listing, booking, activity), batch recommendations, and Manager AI gates. Schedule{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-300">POST /api/cron/platform-autonomy</code> with{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-300">CRON_SECRET</code> so the bus drains and daily rules
            run. Product modes map on{" "}
            <Link href="/admin/autonomy" className="text-emerald-400 hover:text-emerald-300">
              Marketplace autonomy
            </Link>
            .
          </p>
          {error ? (
            <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-200">
              {error}
            </p>
          ) : null}
        </div>

        {briefing ? (
          <>
            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h2 className="text-lg font-semibold text-zinc-200">Autonomy &amp; modes</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Display mode</dt>
                  <dd className="font-mono text-emerald-300">{briefing.autonomy.displayMode}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Stored global mode</dt>
                  <dd className="font-mono text-zinc-300">{briefing.autonomy.globalMode}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Automations enabled</dt>
                  <dd className="text-zinc-300">{briefing.autonomy.automationsEnabled ? "yes" : "no"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Kill switch</dt>
                  <dd className="text-zinc-300">{briefing.autonomy.globalKillSwitch ? "ON" : "off"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-zinc-600">
                Manual = OFF / ASSIST; assist = suggestions; auto = SAFE_AUTOPILOT or FULL_WITH_APPROVAL per policy — see
                autonomy page for the full matrix.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h2 className="text-lg font-semibold text-zinc-200">AI briefing</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
                {briefing.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-zinc-600">
                JSON:{" "}
                <Link href="/api/admin/autonomous-system/briefing" className="text-emerald-400 hover:text-emerald-300">
                  /api/admin/autonomous-system/briefing
                </Link>
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h2 className="text-lg font-semibold text-zinc-200">Event bus</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Pending dispatch:{" "}
                <span className="font-mono text-amber-200">{briefing.eventBus.pendingDispatch}</span>
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs text-zinc-400">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2">Entity</th>
                      <th className="py-2 pr-2">Created</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {briefing.eventBus.recentEvents.map((ev) => (
                      <tr key={ev.id} className="border-b border-zinc-900/80">
                        <td className="py-2 pr-2 font-mono text-zinc-300">{ev.eventType}</td>
                        <td className="py-2 pr-2">
                          {ev.entityType ?? "—"} {ev.entityId ? ev.entityId.slice(0, 8) : ""}…
                        </td>
                        <td className="py-2 pr-2">{ev.createdAt.toISOString().slice(0, 19)}Z</td>
                        <td className="py-2">{ev.processedAt ? "processed" : "pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h2 className="text-lg font-semibold text-zinc-200">Active automation rules (event → action)</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                {briefing.eventBus.activeRules.map((r) => (
                  <li key={r.name} className="flex flex-wrap gap-x-2">
                    <span className="font-mono text-zinc-300">{r.name}</span>
                    <span className="text-zinc-600">·</span>
                    <span>{r.eventType}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-emerald-400/90">{r.actionKind}</span>
                    <span className="text-zinc-600">(p{r.priority})</span>
                  </li>
                ))}
              </ul>
            </section>

            {briefing.metrics ? (
              <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
                <h2 className="text-lg font-semibold text-zinc-200">Growth snapshot (domination metrics)</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-zinc-500">Published stays</dt>
                    <dd className="font-mono text-zinc-200">{briefing.metrics.stays.publishedTotal}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Paid bookings (7d)</dt>
                    <dd className="font-mono text-zinc-200">{briefing.metrics.bookings.paid7d}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">BNHub listing views (7d)</dt>
                    <dd className="font-mono text-zinc-200">{briefing.metrics.traffic.bnhubListingViews7d}</dd>
                  </div>
                </dl>
              </section>
            ) : null}

            <section className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-6">
              <h2 className="text-lg font-semibold text-emerald-200/90">Related tools</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-emerald-400/90">
                <li>
                  <Link href="/admin/content-intelligence" className="hover:text-emerald-300">
                    Content intelligence (performance loop)
                  </Link>
                </li>
                <li>
                  <Link href="/admin/domination" className="hover:text-emerald-300">
                    Domination hub
                  </Link>
                </li>
                <li>
                  <Link href="/admin/autonomy" className="hover:text-emerald-300">
                    Marketplace autonomy &amp; modes
                  </Link>
                </li>
                <li>
                  <Link href="/admin/controls" className="hover:text-emerald-300">
                    Operational controls
                  </Link>
                </li>
                <li>
                  <span className="text-zinc-500">Automation engine run (admin API): </span>
                  <code className="text-zinc-400">POST /api/ai/automations/run</code>
                </li>
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </HubLayout>
  );
}
