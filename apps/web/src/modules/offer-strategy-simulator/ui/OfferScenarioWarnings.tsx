"use client";

import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export function OfferScenarioWarnings({ warnings }: { warnings: OfferSimulationResult["keyWarnings"] }) {
  if (warnings.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-xs text-slate-500">No extra warnings in this model run.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {warnings.map((w, i) => (
        <li
          key={i}
          className="rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-sm text-amber-100"
        >
          {w}
        </li>
      ))}
    </ul>
  );
}
