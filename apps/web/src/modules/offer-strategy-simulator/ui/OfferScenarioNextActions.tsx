"use client";

import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export function OfferScenarioNextActions({ actions }: { actions: OfferSimulationResult["nextActions"] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
      {actions.map((a, i) => (
        <li key={i}>{a}</li>
      ))}
    </ol>
  );
}
