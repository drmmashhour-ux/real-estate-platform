import type { GreenListingMetadata } from "@/modules/green/green.types";
import { QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER } from "@/modules/green-ai/quebec-esg-disclaimers";
import type { QuebecEsgCostEstimateRow } from "@/modules/green-ai/quebec-esg-cost.service";
import type { QuebecEsgIncentiveEstimateRow } from "@/modules/green-ai/quebec-esg-incentive.service";

type Econ = GreenListingMetadata["quebecEsgEconomicsSnapshot"];

function asCostRows(ce: unknown): QuebecEsgCostEstimateRow[] {
  if (!ce || typeof ce !== "object") return [];
  const arr = (ce as { costEstimates?: unknown }).costEstimates;
  return Array.isArray(arr) ? (arr as QuebecEsgCostEstimateRow[]) : [];
}

function asIncentiveRows(inc: unknown): QuebecEsgIncentiveEstimateRow[] {
  if (!inc || typeof inc !== "object") return [];
  const arr = (inc as { incentives?: unknown }).incentives;
  return Array.isArray(arr) ? (arr as QuebecEsgIncentiveEstimateRow[]) : [];
}

export function QuebecEsgIncentivesPanel({ snapshot }: { snapshot: Econ | undefined }) {
  if (!snapshot?.costEstimates || !snapshot?.incentives) {
    return (
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-500">
        Run a green sync on the listing to populate estimated costs and incentives.
      </div>
    );
  }

  const costs = asCostRows(snapshot.costEstimates);
  const incentives = asIncentiveRows(snapshot.incentives);
  const totalInc = (snapshot.incentives as { totalEstimatedIncentives?: number | null })?.totalEstimatedIncentives;

  let totalLow = 0;
  let totalHigh = 0;
  let hasCost = false;
  for (const c of costs) {
    if (c.lowCost != null && c.highCost != null) {
      totalLow += c.lowCost;
      totalHigh += c.highCost;
      hasCost = true;
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-3 py-3 text-xs text-emerald-100/90">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">Estimated costs & incentives</p>
      {hasCost ? (
        <p className="text-emerald-100/80">
          Combined rough cost band: ~{Math.round(totalLow).toLocaleString("en-CA")}–
          {Math.round(totalHigh).toLocaleString("en-CA")} CAD (internal bands, not quotes).
        </p>
      ) : (
        <p className="text-slate-400">Cost band unavailable for this snapshot.</p>
      )}
      <ul className="space-y-1 text-[11px] text-slate-300">
        {costs.slice(0, 6).map((c) => (
          <li key={c.recommendationKey}>
            <span className="text-slate-400">{c.recommendationKey}:</span>{" "}
            {c.lowCost != null && c.highCost != null
              ? `~${c.lowCost.toLocaleString("en-CA")}–${c.highCost.toLocaleString("en-CA")} CAD (${c.confidence} confidence)`
              : "—"}
          </li>
        ))}
      </ul>
      <p className="text-[10px] font-semibold uppercase text-emerald-400/80">Programs (verify eligibility)</p>
      <ul className="space-y-2 text-[11px]">
        {incentives.slice(0, 8).map((r) => (
          <li key={`${r.recommendationKey}-${r.programKey}`} className="rounded border border-white/5 bg-black/25 px-2 py-1">
            <span className="font-medium text-white">{r.title}</span>{" "}
            <span className="text-slate-500">({r.status})</span>
            <div className="text-slate-400">
              {r.estimatedAmount != null
                ? `~${r.estimatedAmount.toLocaleString("en-CA")} CAD illustrative`
                : r.estimatedAmountLow != null && r.estimatedAmountHigh != null
                  ? `Range ~${r.estimatedAmountLow.toLocaleString("en-CA")}–${r.estimatedAmountHigh.toLocaleString("en-CA")} CAD illustrative`
                  : "Amount not modeled — confirm with official program."}
            </div>
          </li>
        ))}
      </ul>
      {totalInc != null && Number.isFinite(totalInc) ? (
        <p className="text-[11px] text-slate-400">Illustrative incentive total (where modeled): ~{totalInc.toLocaleString("en-CA")} CAD</p>
      ) : null}
      {hasCost && totalInc != null && Number.isFinite(totalInc) ? (
        <p className="text-[11px] text-amber-200/80">
          Order-of-magnitude net after modeled incentives: ~{Math.max(0, totalLow - totalInc).toLocaleString("en-CA")}–
          {Math.max(0, totalHigh - totalInc).toLocaleString("en-CA")} CAD — highly uncertain.
        </p>
      ) : null}
      <p className="border-t border-white/10 pt-2 text-[10px] leading-relaxed text-slate-500">{QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER}</p>
    </div>
  );
}
