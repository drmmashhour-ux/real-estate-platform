import type { GlobalGrowthSummary } from "@/modules/global-intelligence/global-intelligence.types";

export function GlobalGrowthComparisonCard({ summary }: { summary: GlobalGrowthSummary }) {
  return (
    <div className="rounded-xl border border-emerald-900/30 bg-black p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">Growth proxy</p>
      <ul className="mt-3 space-y-2">
        {summary.regions.length === 0 ? (
          <li className="text-zinc-500">No growth rows.</li>
        ) : (
          summary.regions.map((r) => (
            <li key={r.regionCode} className="flex justify-between border-b border-zinc-900 pb-2">
              <span>{r.regionCode}</span>
              <span className="text-emerald-300">{r.opportunityUnits}</span>
            </li>
          ))
        )}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">{summary.freshness}</p>
    </div>
  );
}
