import { redirect } from "next/navigation";

import { LaunchChecklistClient } from "@/components/launch/LaunchChecklistClient";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLaunchStatus } from "@/lib/launch/controller";
import { launchPlan } from "@/lib/launch/plan";
import { getGlobalLaunchProgress, getLaunchProgress, getResolvedLaunchDayNumber } from "@/lib/launch/progress";
import { setLaunchStartDateFormAction } from "@/lib/launch/progressServerActions";
import { trackEvent } from "@/src/services/analytics";
import Link from "next/link";

export const dynamic = "force-dynamic";

function clampDay(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 1;
  return Math.min(7, Math.max(1, Math.floor(n)));
}

export default async function LaunchPlanAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const base = `/${locale}/${country}`;
  const adminBase = `${base}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(`${adminBase}`);
  }

  const userId = admin.userId;
  const platform = await getLaunchStatus();
  const launchOn = platform.status === "running";
  const platformDay = launchOn ? platform.currentDay : null;

  const resolvedUserDay = await getResolvedLaunchDayNumber(userId);
  const highlightDay = launchOn && platformDay != null ? platformDay : resolvedUserDay;

  const selectedFromQuery = sp.day != null ? Number.parseInt(sp.day, 10) : NaN;
  const selectedDay = clampDay(!Number.isNaN(selectedFromQuery) ? selectedFromQuery : highlightDay);

  void trackEvent("launch_day_viewed", { day: selectedDay, launchOn, platformDay: platformDay ?? null }).catch(
    () => {}
  );

  const global = await getGlobalLaunchProgress(userId);
  const dayProgress = !launchOn ? await getLaunchProgress(userId, selectedDay) : null;

  const nextDay = platformDay != null && launchOn ? Math.min(7, platformDay + 1) : null;

  const pct = global.totalTasksAll > 0 ? Math.round((global.totalCompleted / global.totalTasksAll) * 100) : 0;

  return (
    <div className="min-h-screen space-y-8 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">LECIPM · Order 49.1</p>
        <h1 className="mt-2 text-2xl font-bold">7-day launch execution</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Checklist is per user and stored in the database. The plan content is read-only — only your completion state
          changes.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={adminBase} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
          <Link href={`${base}/dashboard/admin/launch-control`} className="text-zinc-400 hover:text-zinc-200">
            One-click launch control
          </Link>
        </div>
      </div>

      {launchOn ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Platform launch is <strong>running</strong> — today is <strong>Day {platformDay}</strong> of 7. Showing
          current + next day tasks below.
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h2 className="text-sm font-medium text-zinc-300">Progress (Day 1–7)</h2>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {global.totalCompleted} / {global.totalTasksAll} tasks done · {pct}%
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {global.byDay.map((d) => {
            const isHighlight = (launchOn && platformDay === d.day) || (!launchOn && highlightDay === d.day);
            return (
              <li
                key={d.day}
                className={`rounded-lg border px-2 py-2 text-center text-xs ${
                  isHighlight
                    ? "border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30"
                    : "border-zinc-800 bg-black/30"
                }`}
              >
                <div className="font-semibold text-zinc-300">D{d.day}</div>
                <div className="text-zinc-500">
                  {d.completedTasks} / {d.totalTasks}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {!launchOn ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h2 className="text-sm font-medium text-zinc-300">Day selector</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {launchPlan.map((p) => (
              <Link
                key={p.day}
                href={`${base}/dashboard/admin/launch?day=${p.day}`}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedDay === p.day
                    ? "border-amber-500/50 bg-amber-950/30 text-amber-100"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {p.day}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Auto “current” day: {resolvedUserDay} (from profile start date, if set).
          </p>
          <form className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:items-end" action={setLaunchStartDateFormAction}>
            <input type="hidden" name="localeCountryBase" value={base} />
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-400">
              Launch start date (local)
              <input
                type="date"
                name="start"
                className="rounded border border-zinc-700 bg-black px-2 py-1.5 text-sm text-white"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Save start
            </button>
          </form>
        </section>
      ) : null}

      {launchOn && platformDay != null ? (
        <div className="space-y-8">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Day {platformDay} — current</h2>
            <p className="mt-1 text-lg font-semibold text-[#D4AF37]">{launchPlan[platformDay - 1]?.focus ?? "—"}</p>
            <LaunchCurrentSection userId={userId} base={base} day={platformDay} />
          </section>
          {nextDay != null && nextDay <= 7 && nextDay !== platformDay ? (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Day {nextDay} — next</h2>
              <p className="mt-1 text-lg font-semibold text-zinc-400">{launchPlan[nextDay - 1]?.focus ?? "—"}</p>
              <LaunchCurrentSection userId={userId} base={base} day={nextDay} />
            </section>
          ) : null}
        </div>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Day {selectedDay}</h2>
          <p className="mt-1 text-lg font-semibold text-[#D4AF37]">
            {launchPlan[selectedDay - 1]?.focus ?? "—"}
          </p>
          {dayProgress ? (
            <>
              <p className="text-sm text-zinc-500">
                {dayProgress.completedTasks} / {dayProgress.totalTasks} tasks completed
              </p>
              <LaunchChecklistClient
                key={`ld-${selectedDay}`}
                localeCountryBase={base}
                initialDay={selectedDay}
                initialTaskStates={dayProgress.taskStates}
              />
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}

async function LaunchCurrentSection({ userId, base, day }: { userId: string; base: string; day: number }) {
  const progress = await getLaunchProgress(userId, day);
  return (
    <>
      <p className="text-sm text-zinc-500">
        {progress.completedTasks} / {progress.totalTasks} tasks completed
      </p>
      <LaunchChecklistClient
        key={`ld-run-${day}`}
        localeCountryBase={base}
        initialDay={day}
        initialTaskStates={progress.taskStates}
      />
    </>
  );
}
