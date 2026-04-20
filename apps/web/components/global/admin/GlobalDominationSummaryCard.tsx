import type { GlobalDominationWire } from "@/modules/market-domination/global-market-domination.service";

export function GlobalDominationSummaryCard({ summary }: { summary: GlobalDominationWire | null }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">
        Global domination disabled or unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-900/40 bg-black p-4 text-sm text-zinc-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Cross-region leverage</p>
      <ul className="mt-3 space-y-2">
        {summary.perRegionSignals.map((r) => (
          <li key={r.regionCode} className="flex flex-wrap justify-between gap-2 border-b border-zinc-900 pb-2">
            <span className="font-medium text-amber-100">{r.regionCode}</span>
            <span className="text-xs text-zinc-400">
              expansion {r.expansionScore} · rank {String(r.rankingLiftHint)} · price {String(r.pricingVarianceHint)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-zinc-600">{summary.advisoryNotes.join(" · ")}</p>
    </div>
  );
}
