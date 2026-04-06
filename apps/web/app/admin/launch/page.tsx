import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLaunchDashboardPage() {
  const [rows, totalBookings, checkoutStartedCount, paymentSuccessCount] = await Promise.all([
    prisma.launchEvent
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, event: true, payload: true, timestamp: true, createdAt: true },
      })
      .catch(() => [] as { id: string; event: string; payload: unknown; timestamp: Date; createdAt: Date }[]),
    prisma.booking.count().catch(() => 0),
    prisma.launchEvent.count({ where: { event: "CHECKOUT_START" } }).catch(() => 0),
    prisma.launchEvent.count({ where: { event: "PAYMENT_SUCCESS" } }).catch(() => 0),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-2xl text-white">Launch events</h1>
        <p className="mt-1 text-sm text-slate-400">
          BNHub funnel (all time) and last 100 rows from `launch_events` (newest first). Works without Stripe Connect.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total bookings</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalBookings}</p>
            <p className="mt-1 text-xs text-slate-500">All BNHub booking rows</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Checkout started</p>
            <p className="mt-1 text-2xl font-semibold text-sky-300">{checkoutStartedCount}</p>
            <p className="mt-1 text-xs text-slate-500">launch_events event CHECKOUT_START</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Payment success</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">{paymentSuccessCount}</p>
            <p className="mt-1 text-xs text-slate-500">launch_events event PAYMENT_SUCCESS</p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-3 py-2 font-medium text-slate-300">Event</th>
                <th className="px-3 py-2 font-medium text-slate-300">Timestamp</th>
                <th className="px-3 py-2 font-medium text-slate-300">Payload</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                    No events yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/80 align-top hover:bg-slate-900/40">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-emerald-300">{r.event}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                      {r.timestamp.toISOString()}
                    </td>
                    <td className="max-w-xl px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300 break-all">
                      {JSON.stringify(r.payload)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
