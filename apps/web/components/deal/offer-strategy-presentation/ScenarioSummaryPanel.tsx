"use client";

import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { formatPriceRangeLine, humanizeUnderscores, scenarioTitle, summaryPlain } from "@/components/deal/offer-strategy-presentation/presentationCopy";

export function ScenarioSummaryPanel({
  strategyMode,
  dto,
}: {
  strategyMode: string;
  dto: OfferStrategyPublicDto;
}) {
  const { line, hasNumbers } = formatPriceRangeLine(
    dto.suggestedMinOfferCents,
    dto.suggestedTargetOfferCents,
    dto.suggestedMaxOfferCents,
  );

  return (
    <div className="space-y-3 border-b border-white/10 pb-4 print:border-neutral-300">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold print:text-neutral-700">Scenario</p>
      <h3 className="text-lg font-semibold text-white print:text-neutral-900">{scenarioTitle(strategyMode, dto)}</h3>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Offer illustration</p>
        <p className={`mt-1 text-base font-semibold ${hasNumbers ? "text-premium-gold" : "text-slate-400"} print:text-neutral-900`}>
          {line}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-slate-300 print:text-neutral-800">{summaryPlain(dto)}</p>
      <p className="text-xs text-slate-500 print:text-neutral-600">
        Illustration only — not an appraisal, guarantee, or commitment. {humanizeUnderscores(dto.confidenceLevel)} confidence in this model.
      </p>
    </div>
  );
}
