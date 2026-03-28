"use client";

import { useCallback } from "react";
import { posthog } from "@/components/analytics/PostHogClient";
import type { OfferScenarioInput, ScenarioComparisonResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { OfferScenarioPresentationView } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioPresentationView";
import { OfferScenarioResults } from "@/src/modules/offer-strategy-simulator/ui/OfferScenarioResults";
import { clientCompareIntro } from "@/src/modules/offer-strategy-simulator/ui/simulatorPresentationCopy";

type Props = {
  propertyId: string;
  comparison: ScenarioComparisonResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
  presentationMode?: boolean;
  listPriceCents?: number;
  compareInputs?: [OfferScenarioInput, OfferScenarioInput, OfferScenarioInput];
};

export function OfferScenarioComparison({
  propertyId,
  comparison,
  selectedId,
  onSelect,
  presentationMode,
  listPriceCents,
  compareInputs,
}: Props) {
  const pick = useCallback(
    (id: string) => {
      onSelect(id);
      posthog?.capture("offer_strategy_scenario_selected", { propertyId, scenarioId: id, mode: "compare" });
    },
    [onSelect, propertyId],
  );

  const inputById = (id: string): OfferScenarioInput | undefined => {
    if (!compareInputs) return undefined;
    const idx = comparison.scenarios.findIndex((s) => s.id === id);
    if (idx < 0 || idx > 2) return undefined;
    return compareInputs[idx];
  };

  if (presentationMode && listPriceCents != null && compareInputs) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-premium-gold/25 bg-[#0f0f0f] p-4 text-sm leading-relaxed text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">How to read this</p>
          <p className="mt-2">{clientCompareIntro(comparison)}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {comparison.scenarios.map((s) => {
            const active = selectedId === s.id;
            const inp = inputById(s.id);
            return (
              <div key={s.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  className={`w-full rounded-t-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "border-premium-gold bg-premium-gold/10 text-white"
                      : "border-white/10 bg-[#121212] text-slate-300 hover:border-white/20"
                  }`}
                >
                  {s.label}
                </button>
                <div className="rounded-b-xl border border-t-0 border-white/10 bg-[#0B0B0B]/90 p-2">
                  {inp ? (
                    <OfferScenarioPresentationView
                      result={s.result}
                      title={s.label}
                      offerPriceCents={inp.offerPriceCents}
                      depositAmountCents={inp.depositAmountCents}
                      occupancyDate={inp.occupancyDate}
                      signatureDate={inp.signatureDate}
                      listPriceCents={listPriceCents}
                      compact
                      hideCta
                      hideDisclaimer
                    />
                  ) : (
                    <OfferScenarioResults result={s.result} compact />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="w-full rounded-xl bg-premium-gold py-3.5 text-center text-base font-semibold text-black shadow-lg shadow-black/30 transition hover:bg-[#ddb84d] focus:outline-none focus:ring-2 focus:ring-premium-gold/50"
        >
          Talk this through with your broker or lawyer
        </button>
        <p className="text-center text-[11px] leading-relaxed text-slate-500">{comparison.disclaimer}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-premium-gold/25 bg-[#0f0f0f] p-4 text-sm text-slate-300">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Tradeoffs (illustrative)</p>
        <p className="mt-2 leading-relaxed">{comparison.tradeoffExplanation}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="rounded-md border border-white/10 px-2 py-1">
            Best risk-adjusted: <span className="text-slate-200">{comparison.bestRiskAdjustedScenarioId}</span>
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            Safer (lowest modeled risk): <span className="text-slate-200">{comparison.saferScenarioId}</span>
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            More aggressive: <span className="text-slate-200">{comparison.moreAggressiveScenarioId}</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Confidence: {comparison.confidence}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {comparison.scenarios.map((s) => {
          const active = selectedId === s.id;
          return (
            <div key={s.id} className="space-y-2">
              <button
                type="button"
                onClick={() => pick(s.id)}
                className={`w-full rounded-t-xl border px-3 py-2 text-left text-sm font-medium transition ${
                  active
                    ? "border-premium-gold bg-premium-gold/10 text-white"
                    : "border-white/10 bg-[#121212] text-slate-300 hover:border-white/20"
                }`}
              >
                {s.label}
                <span className="ml-2 text-xs font-normal text-slate-500">({s.id})</span>
              </button>
              <div className="rounded-b-xl border border-t-0 border-white/10 bg-[#0B0B0B]/90 p-3">
                <OfferScenarioResults result={s.result} compact />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">{comparison.disclaimer}</p>
    </div>
  );
}
