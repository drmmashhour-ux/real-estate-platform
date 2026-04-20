import type { GlobalRiskSummary } from "@/modules/global-intelligence/global-intelligence.types";

export function GlobalRiskComparisonCard({ summary }: { summary: GlobalRiskSummary }) {
  return (
    <div className="rounded-xl border border-rose-900/40 bg-black p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400/90">Risk surface</p>
      <ul className="mt-3 space-y-2">
        {summary.regions.length === 0 ? (
          <li className="text-zinc-500">No risk rows.</li>
        ) : (
          summary.regions.map((r) => (
            <li key={r.regionCode} className="flex justify-between gap-2 border-b border-zinc-900 pb-2">
              <span className="text-amber-100">{r.regionCode}</span>
              <span className="text-zinc-400">{r.elevatedCount} elevated proxy</span>
            </li>
          ))
        )}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">Fresh {summary.freshness}</p>
    </div>
  );
}
