import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getHostPayoutBalances, getHostPayouts } from "@/lib/host";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function HostPayoutsPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const [rows, balances] = await Promise.all([getHostPayouts(hostId, 100), getHostPayoutBalances(hostId)]);

  const upcomingRows = rows.filter((r) => r.payoutStatus === "SCHEDULED" || r.payoutStatus === "IN_TRANSIT");
  const historyRows = rows.filter((r) =>
    ["PAID", "FAILED", "REVERSED", "CANCELLED"].includes(r.payoutStatus)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Payouts</h1>
        <p className="mt-1 text-sm text-zinc-500">Track what you have earned and what is on the way.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Current balance (pending)</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: GOLD }}>
            {cad(balances.pendingCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Upcoming payouts</p>
          <p className="mt-2 text-2xl font-bold text-white">{cad(balances.upcomingCents)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paid out (lifetime)</p>
          <p className="mt-2 text-2xl font-bold text-white">{cad(balances.paidOutCents)}</p>
        </div>
      </section>

      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
        <Link
          href="/host/bnhub/payments/onboarding"
          className="text-sm font-medium text-zinc-300 underline-offset-4 hover:underline"
        >
          Stripe Connect — manage payout account →
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white">Upcoming payouts</h2>
        {upcomingRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No scheduled transfers right now.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Eligible / est.</th>
                    <th className="px-4 py-3">Booking ref</th>
                    <th className="px-4 py-3">Net</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRows.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/80 last:border-0">
                      <td className="px-4 py-3 text-zinc-400">
                        {(r.eligibleReleaseAt ?? r.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {r.confirmationCode ?? r.bookingId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                        {cad(r.netAmountCents)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{r.payoutStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Payout history</h2>
        {historyRows.length === 0 && rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#111] p-10 text-center">
            <p className="text-zinc-400">No payouts yet</p>
            <p className="mt-2 text-sm text-zinc-600">
              Completed stays with Stripe Connect will appear here after the platform release window.
            </p>
          </div>
        ) : historyRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No completed payouts in recent records.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Booking ref</th>
                    <th className="px-4 py-3">Gross</th>
                    <th className="px-4 py-3">Fees</th>
                    <th className="px-4 py-3">Net</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/80 last:border-0">
                      <td className="px-4 py-3 text-zinc-400">
                        {(r.releasedAt ?? r.eligibleReleaseAt ?? r.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {r.confirmationCode ?? r.bookingId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-zinc-200">{cad(r.grossAmountCents)}</td>
                      <td className="px-4 py-3 text-zinc-400">{cad(r.platformFeeCents)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                        {cad(r.netAmountCents)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{r.payoutStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
