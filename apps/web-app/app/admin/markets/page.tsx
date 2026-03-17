import Link from "next/link";
import { getActiveMarkets } from "@/lib/market-config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMarketsPage() {
  const markets = await getActiveMarkets();
  const allMarkets = await prisma.marketConfig.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { taxRules: true, policyBindings: true } } },
  });

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Expansion
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Market configuration
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Multi-market launch: currency, language, tax, policy bindings. Use POST /api/admin/markets to create.
          </p>
          <div className="mt-4">
            <Link href="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {allMarkets.length === 0 ? (
            <p className="text-sm text-slate-500">No markets. Create via API POST /api/admin/markets.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Country</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Currency</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Active</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Tax / Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {allMarkets.map((m) => (
                    <tr key={m.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 font-medium text-slate-200">{m.code}</td>
                      <td className="px-4 py-3 text-slate-300">{m.name}</td>
                      <td className="px-4 py-3 text-slate-300">{m.country}</td>
                      <td className="px-4 py-3 text-slate-300">{m.currency}</td>
                      <td className="px-4 py-3">
                        <span className={m.active ? "text-emerald-400" : "text-slate-500"}>{m.active ? "Yes" : "No"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {m._count.taxRules} / {m._count.policyBindings}
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
