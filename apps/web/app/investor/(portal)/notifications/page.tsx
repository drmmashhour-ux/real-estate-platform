import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { listInvestorNotifications, syncInvestorNotificationsFromMetrics } from "@/modules/notifications/investor";

export default async function InvestorNotificationsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/investor/login");
  await syncInvestorNotificationsFromMetrics().catch(() => {});
  const notifications = await listInvestorNotifications(userId, 50);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-slate-500">In-app alerts — mobile push can attach to the same feed later.</p>

      <ul className="mt-8 space-y-3">
        {notifications.length === 0 ? (
          <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-500">
            No investor alerts yet. Threshold-based signals appear as the platform scales.
          </li>
        ) : (
          notifications.map((n) => (
            <li key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-sm font-semibold text-white">{n.title}</p>
              {n.message ? <p className="mt-2 text-sm text-slate-400">{n.message}</p> : null}
              <p className="mt-2 text-xs text-slate-600">{n.createdAt.toLocaleString()}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
