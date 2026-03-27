import Link from "next/link";
import { buildInboxDigest } from "@/modules/notifications/services/digest-builder";

type Props = {
  userId: string;
};

export async function InboxSummaryCards({ userId }: Props) {
  const d = await buildInboxDigest(userId);

  const card =
    "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 hover:border-emerald-500/30";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Link href="/dashboard/notifications" className={card}>
        <p className="text-xs text-slate-500">Unread notifications</p>
        <p className="text-2xl font-semibold text-white">{d.unreadNotificationCount}</p>
      </Link>
      <Link href="/dashboard/tasks" className={card}>
        <p className="text-xs text-slate-500">Open tasks</p>
        <p className="text-2xl font-semibold text-white">{d.openActionCount}</p>
      </Link>
      <Link href="/dashboard/tasks?overdue=1" className={card}>
        <p className="text-xs text-slate-500">Overdue</p>
        <p className="text-2xl font-semibold text-amber-200">{d.overdueActionCount}</p>
      </Link>
      <Link href="/dashboard/tasks?dueToday=1" className={card}>
        <p className="text-xs text-slate-500">Due today</p>
        <p className="text-2xl font-semibold text-emerald-200">{d.dueTodayActionCount}</p>
      </Link>
    </div>
  );
}
