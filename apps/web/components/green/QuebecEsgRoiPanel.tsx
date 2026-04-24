import type { GreenListingMetadata } from "@/modules/green/green.types";
import { QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER } from "@/modules/green-ai/quebec-esg-disclaimers";
import type { QuebecEsgRetrofitRoiResult } from "@/modules/green-ai/quebec-esg-roi.service";

type Econ = GreenListingMetadata["quebecEsgEconomicsSnapshot"];

function asRoi(raw: unknown): QuebecEsgRetrofitRoiResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.simpleRoiNarrative) || typeof o.scoreDelta !== "number") return null;
  return raw as QuebecEsgRetrofitRoiResult;
}

export function QuebecEsgRoiPanel({ snapshot }: { snapshot: Econ | undefined }) {
  const roi = snapshot?.roi ? asRoi(snapshot.roi) : null;
  if (!roi) {
    return (
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-500">
        ROI narrative will appear after green economics sync.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-blue-500/20 bg-blue-950/25 px-3 py-3 text-xs text-blue-100/90">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400/90">Scenario ROI & resale (illustrative)</p>
      {roi.netCostLow != null && roi.netCostHigh != null ? (
        <p>
          Net cost band (very rough): ~{Math.round(roi.netCostLow).toLocaleString("en-CA")}–
          {Math.round(roi.netCostHigh).toLocaleString("en-CA")} CAD after modeled incentives.
        </p>
      ) : (
        <p className="text-slate-400">Net cost band not computed — see narratives.</p>
      )}
      <p className="text-[11px] text-slate-300">Score delta (internal scale): {roi.scoreDelta > 0 ? "+" : ""}{roi.scoreDelta}</p>
      <div>
        <p className="text-[10px] font-medium text-slate-400">Narrative</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-[11px] text-slate-300">
          {roi.simpleRoiNarrative.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-500">Conservative</p>
          <ul className="mt-1 space-y-1 text-[10px] text-slate-400">
            {roi.resaleImpactScenario.conservative.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">Neutral</p>
          <ul className="mt-1 space-y-1 text-[10px] text-slate-400">
            {roi.resaleImpactScenario.neutral.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">Optimistic</p>
          <ul className="mt-1 space-y-1 text-[10px] text-slate-400">
            {roi.resaleImpactScenario.optimistic.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        </div>
      </div>
      {roi.paybackNotes.length ? (
        <div>
          <p className="text-[10px] font-medium text-slate-400">Payback notes</p>
          <ul className="mt-1 list-inside list-disc text-[10px] text-slate-500">
            {roi.paybackNotes.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="border-t border-white/10 pt-2 text-[10px] leading-relaxed text-slate-500">{QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER}</p>
    </div>
  );
}
