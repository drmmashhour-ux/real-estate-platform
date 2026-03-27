"use client";

import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { nextStepPlain } from "@/components/deal/offer-strategy-presentation/presentationCopy";

export function ScenarioNextStepCard({ dto }: { dto: OfferStrategyPublicDto }) {
  return (
    <div className="pt-2 print:border-t print:border-neutral-300">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Suggested next step</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[#E8C547] print:text-neutral-900">{nextStepPlain(dto)}</p>
      <p className="mt-3 text-xs text-slate-500 print:text-neutral-600">
        This is a discussion aid only. Your broker or lawyer can adapt language for your situation.
      </p>
    </div>
  );
}
