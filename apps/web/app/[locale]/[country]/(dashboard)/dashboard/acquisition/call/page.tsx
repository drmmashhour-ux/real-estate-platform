import { AcquisitionCallAssistClient } from "@/components/acquisition/AcquisitionCallAssistClient";
import { getAcquisitionDashboardVm } from "@/modules/acquisition/acquisition.service";
import {
  getConversionStats,
  suggestWinningCategories,
} from "@/modules/sales-scripts/sales-script-tracking.service";

export const dynamic = "force-dynamic";

export default async function AcquisitionCallAssistPage() {
  const [dash, stats, suggestions] = await Promise.all([
    getAcquisitionDashboardVm(),
    getConversionStats(90),
    suggestWinningCategories(3),
  ]);

  return (
    <div className="mx-auto max-w-[1680px] space-y-8 p-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <h2 className="text-sm font-semibold text-zinc-400">Script performance (90d)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats.byCategory).map(([cat, v]) => (
            <div key={cat} className="rounded-xl border border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">{cat.replace(/_/g, " ")}</p>
              <p className="mt-1 font-mono text-lg text-white">{v.total} calls</p>
              <p className="mt-2 text-[11px] text-zinc-500">
                DEMO {v.byOutcome.DEMO ?? 0} · CLOSED {v.byOutcome.CLOSED ?? 0} · LOST {v.byOutcome.LOST ?? 0}
              </p>
            </div>
          ))}
        </div>
        {suggestions.length > 0 ? (
          <p className="mt-4 text-xs text-emerald-300/90">
            Strongest signals (heuristic):{" "}
            {suggestions.map((s) => `${s.category} (${(s.demoOrClosedRate * 100).toFixed(0)}%)`).join(" · ")}
          </p>
        ) : (
          <p className="mt-4 text-xs text-zinc-500">Log more calls to unlock conversion hints.</p>
        )}
        {stats.topObjections.length > 0 ? (
          <p className="mt-2 text-xs text-zinc-500">
            Frequent objection tags: {stats.topObjections.slice(0, 5).map((o) => o.label).join(", ")}
          </p>
        ) : null}
      </section>

      <AcquisitionCallAssistClient contacts={dash.contacts} />
    </div>
  );
}
