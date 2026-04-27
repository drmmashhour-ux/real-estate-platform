import Link from "next/link";

import { launchPlan } from "@/lib/launch/plan";
import { getTodaysLaunchTasks } from "@/lib/launch/progress";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  locale: string;
  country: string;
};

/**
 * Dashboard home: current launch day + top 3 outstanding tasks (Order 49.1).
 */
export async function TodaysLaunchWidget({ userId, locale, country }: Props) {
  const { currentDay, topTasks } = await getTodaysLaunchTasks(userId, 3);
  const focus = launchPlan[currentDay - 1]?.focus ?? "";
  const base = `/${locale}/${country}`;

  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-black/40 p-4 text-white",
        "shadow-sm shadow-amber-900/20"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200/90">Today&apos;s launch plan</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">
        Day {currentDay}: {focus}
      </p>
      {topTasks.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-zinc-300">
          {topTasks.map((t) => (
            <li key={`${t.day}-${t.taskIndex}`}>{t.text}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">All tasks for today are checked off — nice work.</p>
      )}
      <Link
        href={`${base}/dashboard/admin/launch`}
        className="mt-3 inline-block text-sm font-medium text-amber-400 hover:text-amber-300 hover:underline"
      >
        Open full 7-day launch dashboard
      </Link>
    </div>
  );
}
