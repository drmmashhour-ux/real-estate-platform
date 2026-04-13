import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { ExecutionAdminClient } from "@/components/admin/ExecutionAdminClient";
import { utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";
import { buildExecutionAlerts } from "@/src/modules/execution/alerts";
import { DAILY_TARGETS, REVENUE_GOAL_USD } from "@/src/modules/execution/constants";
import { recentCrmExecutionActions } from "@/src/modules/execution/crmBridge";
import { getExecutionDay, getExecutionDaysInRange } from "@/src/modules/execution/dailyTracker";
import { aggregateExecutionAllTime, computeProgressForDays } from "@/src/modules/execution/progressTracker";
import { compareDayToTargets, compareWeekToTargets } from "@/src/modules/execution/targetEngine";

export const dynamic = "force-dynamic";

export default async function AdminExecutionPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));

  let today = null as Awaited<ReturnType<typeof getExecutionDay>>;
  let weekDays: Awaited<ReturnType<typeof getExecutionDaysInRange>> = [];
  let allTime = null as Awaited<ReturnType<typeof aggregateExecutionAllTime>> | null;
  let crmActions: Awaited<ReturnType<typeof recentCrmExecutionActions>> = [];

  try {
    [today, weekDays, allTime, crmActions] = await Promise.all([
      getExecutionDay(now),
      getExecutionDaysInRange(weekStart, now),
      aggregateExecutionAllTime(),
      recentCrmExecutionActions(12),
    ]);
  } catch {
    /* migration pending */
  }

  const dayCmp = compareDayToTargets(today);
  const weekCmp = compareWeekToTargets(weekDays);
  const weekProgress = computeProgressForDays(weekDays);
  const alerts = buildExecutionAlerts(today);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Revenue execution</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Daily execution</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Enforce daily outbound minimums, log bookings and revenue, and watch progress toward{" "}
            <span className="text-amber-200/90">${REVENUE_GOAL_USD.toLocaleString()}</span> on the execution ledger.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <Link href="/admin/revenue" className="text-sky-400 hover:text-sky-300">
              Revenue engine →
            </Link>
          </div>
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="border-b border-amber-900/40 bg-amber-950/20">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold text-amber-200">Alerts</h2>
            <ul className="mt-2 space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.code}
                  className={
                    a.level === "critical"
                      ? "text-sm text-rose-300"
                      : "text-sm text-amber-200/90"
                  }
                >
                  <span className="font-mono text-xs text-slate-500">{a.code}</span> — {a.message}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Today (UTC)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Targets: {DAILY_TARGETS.messages} messages · {DAILY_TARGETS.brokers} brokers · {DAILY_TARGETS.bookings}{" "}
            booking
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Messages" value={today?.messagesSent ?? 0} target={DAILY_TARGETS.messages} met={dayCmp.messages.met} />
            <Stat label="Brokers" value={today?.brokersContacted ?? 0} target={DAILY_TARGETS.brokers} met={dayCmp.brokers.met} />
            <Stat label="Bookings" value={today?.bookingsCompleted ?? 0} target={DAILY_TARGETS.bookings} met={dayCmp.bookings.met} />
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Revenue (today)</p>
              <p className="mt-1 text-2xl font-semibold text-pink-300">
                ${(today?.revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {dayCmp.missedLabels.length > 0 ? (
            <div className="mt-4 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
              <p className="text-sm font-medium text-rose-200">Missed today</p>
              <ul className="mt-2 list-inside list-disc text-sm text-rose-200/80">
                {dayCmp.missedLabels.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-400/90">All daily targets met so far today.</p>
          )}
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Last 7 days</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Avg daily revenue</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                ${weekProgress.avgDailyRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Avg messages / day</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {weekProgress.avgDailyMessages.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Avg bookings / day</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">
                {weekProgress.avgDailyBookings.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Messages</th>
                  <th className="py-2 pr-4">Brokers</th>
                  <th className="py-2 pr-4">Bookings</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-slate-600">
                      No rows yet — use Quick log below.
                    </td>
                  </tr>
                ) : (
                  weekDays.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/80">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {utcDayStart(d.date).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-2 pr-4">{d.messagesSent}</td>
                      <td className="py-2 pr-4">{d.brokersContacted}</td>
                      <td className="py-2 pr-4">{d.bookingsCompleted}</td>
                      <td className="py-2">${d.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {weekCmp.missedLabels.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-900/30 bg-slate-900/40 p-4">
              <p className="text-sm font-medium text-amber-200/90">Weekly gaps vs targets (scaled to days logged)</p>
              <ul className="mt-2 list-inside list-disc text-sm text-amber-200/70">
                {weekCmp.missedLabels.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ) : weekDays.length > 0 ? (
            <p className="mt-4 text-sm text-emerald-400/90">Week cumulative targets satisfied for logged days.</p>
          ) : null}
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Progress toward ${REVENUE_GOAL_USD.toLocaleString()}</h2>
          <p className="mt-1 text-sm text-slate-500">Sum of all execution-day revenue rows (manual + logged).</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">Total execution revenue</p>
              <p className="mt-1 text-3xl font-semibold text-violet-300">
                ${(allTime?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {(allTime?.pctTowardGoal ?? 0).toFixed(1)}% of ${REVENUE_GOAL_USD.toLocaleString()} goal
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all"
                  style={{ width: `${Math.min(100, allTime?.pctTowardGoal ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase text-slate-500">All-time activity (rollup)</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li>Days with rows: {allTime?.dayCount ?? 0}</li>
                <li>Messages (sum): {allTime?.totalMessages ?? 0}</li>
                <li>Broker touches (sum): {allTime?.totalBrokers ?? 0}</li>
                <li>Bookings (sum): {allTime?.totalBookings ?? 0}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">CRM execution log</h2>
          <p className="mt-1 text-sm text-slate-500">Recent user-tagged actions and conversions.</p>
          <ul className="mt-4 space-y-2">
            {crmActions.length === 0 ? (
              <li className="text-sm text-slate-600">No CRM-tagged actions yet.</li>
            ) : (
              crmActions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-300"
                >
                  <span className="font-mono text-xs text-amber-400">{a.type}</span>
                  <span className="text-slate-600"> · </span>
                  <span className="text-slate-500">{a.status}</span>
                  {a.user ? (
                    <>
                      <span className="text-slate-600"> · </span>
                      <span>{a.user.name ?? a.user.email}</span>
                    </>
                  ) : null}
                  <span className="mt-1 block font-mono text-[11px] text-slate-600">
                    {a.createdAt.toISOString().slice(0, 19)}Z
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Quick log</h2>
          <p className="mt-1 text-sm text-slate-500">Writes today&apos;s UTC execution row + CRM action where applicable.</p>
          <div className="mt-4 max-w-xl">
            <ExecutionAdminClient />
          </div>
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-amber-400/90">
            LECIPM EXECUTION SYSTEM ACTIVE — PATH TO 100K TRACKED
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  target,
  met,
}: {
  label: string;
  value: number;
  target: number;
  met: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        met ? "border-emerald-900/50 bg-emerald-950/20" : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
        <span className="text-lg font-normal text-slate-500"> / {target}</span>
      </p>
    </div>
  );
}
