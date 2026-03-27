"use client";

import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { humanizeUnderscores } from "@/components/deal/offer-strategy-presentation/presentationCopy";

export function ScenarioProtectionsPanel({ dto }: { dto: OfferStrategyPublicDto }) {
  const items = dto.recommendedConditions;
  if (!items.length) {
    return (
      <div className="border-b border-white/10 py-4 print:border-neutral-300">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Protections to discuss</p>
        <p className="mt-2 text-sm text-slate-400 print:text-neutral-700">No specific conditions were suggested from current data.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 py-4 print:border-neutral-300">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Protections to discuss</p>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 8).map((c) => (
          <li key={`${c.category}-${c.label}`} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm text-slate-200 print:border-neutral-200 print:bg-neutral-50 print:text-neutral-900">
            <span className="font-medium text-white print:text-neutral-900">{c.label}</span>
            <span className="text-slate-500 print:text-neutral-600"> · {humanizeUnderscores(c.category)}</span>
            {c.note ? <p className="mt-1 text-xs text-slate-400 print:text-neutral-700">{c.note}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
