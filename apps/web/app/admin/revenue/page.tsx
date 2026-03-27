import Link from "next/link";
import { getRevenueSummary, getRevenueLedger } from "@/lib/revenue-intelligence";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const [summary, ledger] = await Promise.all([
    getRevenueSummary({ periodStart: start, periodEnd: end }),
    getRevenueLedger({ periodStart: start, periodEnd: end, limit: 30 }),
  ]);

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Revenue
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Revenue intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Booking commissions, subscriptions, promotions, and cost tracking. Export-ready reporting.
          </p>
          <div className="mt-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Summary (last 30 days)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total revenue (cents)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.totalCents}</p>
            </div>
            {Object.entries(summary.byType).map(([type, cents]) => (
              <div key={type} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">{type}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-100">{cents}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Recent ledger entries</h2>
          {ledger.entries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No entries in this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Amount (¢)</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-200">{e.type}</td>
                      <td className="px-4 py-3 text-slate-300">{e.entityType}:{e.entityId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right text-slate-200">{e.amountCents}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(e.createdAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
