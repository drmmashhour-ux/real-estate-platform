import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminPayoutRows, getAdminPayoutSummary } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { PayoutsAdminClient } from "./PayoutsAdminClient";
import { BnhubPayoutLedgerAdminClient } from "./BnhubPayoutLedgerAdminClient";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function AdminPayoutsControlPage() {
  await requireAdminControlUserId();
  const [summary, rows] = await Promise.all([getAdminPayoutSummary(), getAdminPayoutRows(120)]);

  return (
    <LecipmControlShell>
      <div className="space-y-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payouts</h1>
            <p className="mt-1 text-sm text-zinc-500">BNHUB host transfers — ledger + operational tools.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/payouts/export"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Export CSV
            </a>
            <Link
              href="/admin/monitoring"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Monitoring & exports
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Pending</p>
            <p className="mt-1 text-xl font-bold" style={{ color: GOLD }}>
              {cad(summary.pendingCents)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Processing</p>
            <p className="mt-1 text-xl font-bold text-white">{cad(summary.processingCents)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Sent (month)</p>
            <p className="mt-1 text-xl font-bold text-white">{cad(summary.sentThisMonthCents)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Failed / Avg days</p>
            <p className="mt-1 text-xl font-bold text-rose-300">{summary.failedCount}</p>
            <p className="text-xs text-zinc-500">
              Avg payout time: {summary.avgDaysToPaid != null ? `${summary.avgDaysToPaid.toFixed(1)}d` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase text-zinc-500">Lifetime paid (net)</p>
            <p className="mt-1 text-xl font-bold text-white">{cad(summary.completedLifetimeCents)}</p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Fees</th>
                  <th className="px-4 py-3">Net</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Released</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">
                      All payouts are up to date — no ledger rows yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/80">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{r.id.slice(0, 10)}…</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{r.hostEmail}</td>
                      <td className="px-4 py-3 text-xs">{r.bookingRef ?? "—"}</td>
                      <td className="px-4 py-3">{cad(r.grossCents)}</td>
                      <td className="px-4 py-3 text-zinc-500">{cad(r.feeCents)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                        {cad(r.netCents)}
                      </td>
                      <td className="px-4 py-3 text-xs">{r.status}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {r.releasedAt?.toISOString().slice(0, 10) ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Operational queue</h2>
          <PayoutsAdminClient />
        </div>

        <div className="border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Connect + manual ledger</h2>
          <p className="mt-1 text-sm text-zinc-500">Orchestrated transfers and manual-market queues.</p>
          <div className="mt-4">
            <BnhubPayoutLedgerAdminClient />
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          <Link href="/admin/finance/payouts" className="text-zinc-400 underline">
            Finance payouts hub
          </Link>
        </p>
      </div>
    </LecipmControlShell>
  );
}
