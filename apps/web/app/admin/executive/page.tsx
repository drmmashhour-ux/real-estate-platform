import Link from "next/link";
import { buildExecutiveSnapshot, getExecutiveSnapshots } from "@/lib/executive-metrics";
import { ExecutiveDashboardClient } from "@/components/admin/ExecutiveDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminExecutivePage() {
  const today = new Date();
  const [snapshot, recent] = await Promise.all([
    buildExecutiveSnapshot({ date: today, persist: false }),
    getExecutiveSnapshots({ limit: 7 }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Executive</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Executive Control</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            AI executive layer: KPIs from real growth AI / orchestration / booking data, bottleneck-driven recommendations,
            and optional safe operational actions (env-gated). Does not auto-handle refunds, disputes, or compliance
            judgments.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/admin/dashboard" className="font-medium text-emerald-400 hover:text-emerald-300">
              ← Admin hub
            </Link>
            <Link href="/admin/ai-inbox" className="text-amber-400 hover:text-amber-300">
              AI inbox
            </Link>
            <Link href="/admin/ai-learning" className="text-amber-400 hover:text-amber-300">
              Self-learning
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <ExecutiveDashboardClient />
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Business snapshot (finance)</h2>
          <p className="mt-1 text-sm text-slate-500">
            GMV, net revenue, MRR/ARR from existing executive metrics — unchanged pipeline.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">GMV (¢)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.gmvCents}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Net revenue (¢)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{snapshot.netRevenueCents}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Bookings</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.bookingsCount}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Active hosts</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.activeHostsCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Stored finance snapshots</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No stored finance snapshots. Use POST /api/admin/executive to persist (legacy).
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">GMV</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Net rev</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Bookings</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-200">{new Date(s.date).toISOString().slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{s.gmvCents}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{s.netRevenueCents}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{s.bookingsCount}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{s.mrrCents}</td>
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
