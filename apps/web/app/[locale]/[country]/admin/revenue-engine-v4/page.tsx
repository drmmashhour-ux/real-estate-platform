import Link from "next/link";
import { getRevenueEngineV4AdminSnapshot } from "@/src/modules/revenue/revenue.engine";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function AdminRevenueEngineV4Page() {
  const snap = await getRevenueEngineV4AdminSnapshot(30);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/revenue" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Revenue intelligence
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Revenue Engine v4</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Data-backed prioritization and audit trail. No automatic price changes — host/seller approval required unless product
          policy explicitly enables safe autopilot.
        </p>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Feature flags</h2>
          <ul className="mt-2 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
            {Object.entries(revenueV4Flags).map(([k, v]) => (
              <li key={k}>
                {k}: <span className={v ? "text-emerald-400" : "text-slate-500"}>{v ? "on" : "off"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-200">Prioritized FSBO opportunities (heuristic)</h2>
          <ul className="mt-2 space-y-2">
            {snap.prioritized.length === 0 ? (
              <li className="text-sm text-slate-500">No rows (engine off or empty inventory).</li>
            ) : (
              snap.prioritized.map((p) => (
                <li
                  key={p.entityId}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300"
                >
                  <span className="font-mono text-xs text-slate-500">{p.entityId}</span> · score {p.priorityScore} · {p.summary}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-200">Recent audit log</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {snap.recentAudit.length === 0 ? (
              <li>No audit entries yet.</li>
            ) : (
              snap.recentAudit.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-2 border-b border-slate-800/80 py-1">
                  <span>{a.createdAt.toISOString()}</span>
                  <span className="text-slate-500">{a.engine}</span>
                  <span>{a.action}</span>
                  {a.confidence != null && <span>conf {a.confidence.toFixed(0)}</span>}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
