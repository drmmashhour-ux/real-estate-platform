"use client";

import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { clientRiskSummary, filterClientFacingWarnings, humanizeUnderscores, readinessLevel, readinessPhrase } from "@/components/deal/offer-strategy-presentation/presentationCopy";

export function ScenarioRisksPanel({ dto }: { dto: OfferStrategyPublicDto }) {
  const level = readinessLevel(dto);
  const warnings = filterClientFacingWarnings(dto.warnings);

  return (
    <div className="border-b border-white/10 py-4 print:border-neutral-300">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Readiness & risk</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-100 print:border-neutral-300 print:bg-neutral-100 print:text-neutral-900">
          Readiness: {humanizeUnderscores(level)}
        </span>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-100 print:border-neutral-300 print:bg-neutral-100 print:text-neutral-900">
          Risk signal: {clientRiskSummary(dto.riskLevel)}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-300 print:text-neutral-800">{readinessPhrase(level)}</p>
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-amber-100/90 print:text-neutral-900">
          {warnings.map((w) => (
            <li key={w.slice(0, 80)} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
