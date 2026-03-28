"use client";

import type { SavedScenariosComparisonView } from "@/src/modules/offer-strategy-simulator/domain/savedScenario.types";
import { OfferScenarioResults } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioResults";

type Props = {
  comparison: SavedScenariosComparisonView;
  onClose: () => void;
};

export function SavedScenarioComparison({ comparison, onClose }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-premium-gold/30 bg-[#0f0f0f] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Compare saved snapshots</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{comparison.summary}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-[#0B0B0B] p-3">
          <p className="text-xs font-semibold text-slate-200">{comparison.a.scenarioLabel}</p>
          <p className="mt-1 text-[10px] text-slate-500">{new Date(comparison.a.createdAt).toLocaleString()}</p>
          <div className="mt-3">
            <OfferScenarioResults result={comparison.a.output} compact />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0B0B0B] p-3">
          <p className="text-xs font-semibold text-slate-200">{comparison.b.scenarioLabel}</p>
          <p className="mt-1 text-[10px] text-slate-500">{new Date(comparison.b.createdAt).toLocaleString()}</p>
          <div className="mt-3">
            <OfferScenarioResults result={comparison.b.output} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
