import Link from "next/link";
import { redirect } from "next/navigation";
import { UserEventType } from "@prisma/client";
import { prisma } from "@repo/db";
import { isLiveDebugDashboardEnabled } from "@/src/modules/analytics/liveDebugGate";
import {
  detectCheckoutDropOffs,
  detectPropertyDropOffs,
  funnelCountsSince,
} from "@/src/modules/analytics/dropOffDetection";

export const dynamic = "force-dynamic";

export default async function AdminLiveDebugPage() {
  if (!isLiveDebugDashboardEnabled()) {
    redirect("/admin");
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since10m = new Date(Date.now() - 10 * 60 * 1000);

  const [recent, activeIds, funnel, propDrops, checkoutDrops] = await Promise.all([
    prisma.userEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        eventType: true,
        userId: true,
        createdAt: true,
        metadata: true,
      },
    }),
    prisma.userEvent.findMany({
      where: { createdAt: { gte: since10m }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
      take: 200,
    }),
    funnelCountsSince(since24h),
    detectPropertyDropOffs(20),
    detectCheckoutDropOffs(20),
  ]);

  const funnelOrder: UserEventType[] = [
    UserEventType.SEARCH_PERFORMED,
    UserEventType.LISTING_VIEW,
    UserEventType.INQUIRY,
    UserEventType.BOOKING_START,
    UserEventType.CHECKOUT_START,
    UserEventType.PAYMENT_SUCCESS,
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Live debug</h1>
          <p className="mt-1 text-sm text-slate-400">
            Funnel + recent <code className="text-emerald-400">user_events</code>. Requires{" "}
            <code className="text-emerald-400">LIVE_DEBUG_MODE=1</code>.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active users (10 min)</p>
            <p className="mt-2 text-3xl font-semibold text-white">{activeIds.length}</p>
            <p className="mt-1 text-xs text-slate-500">Distinct userId in user_events</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Conversion funnel (24h counts)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {funnelOrder.map((t) => (
                <div
                  key={t}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
                >
                  <span className="text-slate-500">{t.replace(/_/g, " ")}</span>
                  <span className="ml-2 font-mono text-emerald-400">{funnel[t] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-white">Property drop-offs</h2>
            <p className="text-xs text-slate-500">LISTING_VIEW without INQUIRY within 5 minutes</p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
              {propDrops.length === 0 ? (
                <li className="text-slate-500">None detected in window.</li>
              ) : (
                propDrops.map((d) => (
                  <li key={`${d.userId}-${d.viewedAt.toISOString()}`} className="flex justify-between gap-2">
                    <Link href={`/admin/live-debug/user/${d.userId}`} className="text-emerald-400 hover:underline">
                      {d.userId.slice(0, 8)}…
                    </Link>
                    <span className="text-slate-500">{d.viewedAt.toISOString()}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-white">Checkout drop-offs</h2>
            <p className="text-xs text-slate-500">CHECKOUT_START without PAYMENT_SUCCESS within 10 minutes</p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
              {checkoutDrops.length === 0 ? (
                <li className="text-slate-500">None detected in window.</li>
              ) : (
                checkoutDrops.map((d) => (
                  <li key={`${d.userId}-${d.checkoutAt.toISOString()}`} className="flex justify-between gap-2">
                    <Link href={`/admin/live-debug/user/${d.userId}`} className="text-emerald-400 hover:underline">
                      {d.userId.slice(0, 8)}…
                    </Link>
                    <span className="text-slate-500">{d.checkoutAt.toISOString()}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-white">Recent events (50)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-2 pr-2">Time</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">User</th>
                  <th className="py-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800/80">
                    <td className="py-2 pr-2 font-mono text-slate-400">{e.createdAt.toISOString()}</td>
                    <td className="py-2 pr-2 text-slate-200">{e.eventType}</td>
                    <td className="py-2 pr-2">
                      {e.userId ? (
                        <Link className="text-emerald-400 hover:underline" href={`/admin/live-debug/user/${e.userId}`}>
                          {e.userId.slice(0, 10)}…
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="max-w-md truncate py-2 text-slate-500">
                      {e.metadata ? JSON.stringify(e.metadata).slice(0, 120) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-white">Recent errors (30)</h2>
          <RecentErrors />
        </section>
      </div>
    </div>
  );
}

async function RecentErrors() {
  const errors = await prisma.errorEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  if (errors.length === 0) {
    return <p className="mt-2 text-xs text-slate-500">No rows in error_events yet.</p>;
  }
  return (
    <ul className="mt-3 space-y-2 text-xs">
      {errors.map((e) => (
        <li key={e.id} className="rounded border border-slate-800 bg-slate-950 p-2">
          <div className="flex flex-wrap gap-2 text-slate-400">
            <span className="font-mono text-rose-400">{e.errorType}</span>
            <span>{e.createdAt.toISOString()}</span>
            {e.route ? <span className="truncate">{e.route}</span> : null}
          </div>
          <p className="mt-1 text-slate-300">{e.message.slice(0, 500)}</p>
        </li>
      ))}
    </ul>
  );
}
