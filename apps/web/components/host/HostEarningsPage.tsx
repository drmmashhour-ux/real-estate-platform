import Link from "next/link";
import type { HostEarningsSnapshot } from "@/lib/host-earnings/dashboard";
import type { HostMonthlyRow } from "@/lib/host-earnings/monthly-breakdown";

const GOLD = "#D4AF37";

type Props = {
  snapshot: HostEarningsSnapshot;
  manualMarket: boolean;
  connectIncomplete: boolean;
  hasStripe: boolean;
  monthlyBreakdown: HostMonthlyRow[];
};

/**
 * Host earnings: revenue, payouts, and monthly history (BNHUB / CAD by default in snapshot).
 */
export function HostEarningsPage({ snapshot, manualMarket, connectIncomplete, hasStripe, monthlyBreakdown }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Earnings</h1>
        <p className="mt-1 text-sm text-zinc-500">Total revenue, payouts, and a simple monthly view from completed guest payments.</p>
      </div>

      {manualMarket ? (
        <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          This market may use manual payout processing. Balances can reflect operations settlement outside Stripe Connect.
        </div>
      ) : null}

      {!manualMarket && (hasStripe && connectIncomplete) ? (
        <div className="rounded-xl border border-sky-800/60 bg-sky-950/20 px-4 py-3 text-sm text-sky-100">
          Complete Stripe onboarding to receive automatic payouts. You can also track manual queue lines below.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Gross (paid)</p>
          <p className="mt-2 text-2xl font-bold text-white">{(snapshot.grossEarningsCents / 100).toFixed(2)} CAD</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pending payouts</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: GOLD }}>
            {(snapshot.pendingPayoutsCents / 100).toFixed(2)} CAD
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paid out</p>
          <p className="mt-2 text-2xl font-bold text-white">{(snapshot.paidOutCents / 100).toFixed(2)} CAD</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Manual queue</p>
          <p className="mt-2 text-2xl font-bold text-zinc-200">{(snapshot.manualQueuedCents / 100).toFixed(2)} CAD</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">Next payout window</p>
          <p className="mt-2 text-lg text-zinc-200">
            {snapshot.nextPayoutAt ? new Date(snapshot.nextPayoutAt).toLocaleString() : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">Recent transfers</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-zinc-400">
            {snapshot.recentPayouts.length === 0 ? (
              <li>None in window.</li>
            ) : (
              snapshot.recentPayouts.slice(0, 5).map((p) => (
                <li key={p.bookingId} className="flex justify-between gap-2">
                  <span className="truncate text-zinc-500">{p.bookingId.slice(0, 8)}…</span>
                  <span>
                    {(p.amountCents / 100).toFixed(2)} · {p.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
        <h2 className="text-sm font-semibold text-white">Monthly breakdown (guest payments, completed)</h2>
        <p className="mt-1 text-xs text-zinc-500">Totals by calendar month; cents-accurate in the ledger.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2">Guest payments</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-zinc-500">
                    No completed payments in the last 12 months.
                  </td>
                </tr>
              ) : (
                monthlyBreakdown.map((m) => (
                  <tr key={m.month} className="border-b border-zinc-800/80 last:border-0">
                    <td className="py-2.5 pr-4 text-zinc-300">{m.label}</td>
                    <td className="py-2.5" style={{ color: GOLD }}>
                      {(m.cents / 100).toFixed(2)} CAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Recent bookings (payment snapshot)</h2>
        <ul className="mt-3 divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-[#0c0c0c]">
          {snapshot.bookings.length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">No bookings yet.</li>
          ) : (
            snapshot.bookings.slice(0, 15).map((b) => (
              <li
                key={b.bookingId}
                className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-200">{b.listingTitle}</p>
                  <p className="text-xs text-zinc-500">
                    Payment {b.paymentStatus}
                    {b.payoutRowStatus ? ` · Payout ${b.payoutRowStatus}` : ""}
                    {b.manualPayoutStatus ? ` · Manual ${b.manualPayoutStatus}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <p>Guest paid {(b.totalChargeCents / 100).toFixed(2)} CAD</p>
                  <p>
                    Platform {(b.platformFeeCents ?? 0) / 100} CAD · Expected host {(b.hostPayoutCents ?? 0) / 100} CAD
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/host" className="text-zinc-400 hover:text-white">
          ← Host home
        </Link>
        <Link href="/host/payouts" className="font-medium" style={{ color: GOLD }}>
          Payout details →
        </Link>
      </div>
    </div>
  );
}
