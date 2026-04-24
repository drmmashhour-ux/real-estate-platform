"use client";

import type { GreenSearchResultDecoration } from "@/modules/green-ai/green-search.types";

type Props = {
  /** Server should only pass this to broker / admin UIs. */
  decoration: GreenSearchResultDecoration;
};

/**
 * Richer copy for staff — never presented as a government label.
 */
export function GreenBrokerSearchInsights({ decoration }: Props) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-left text-sm text-amber-50/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Internal green intelligence</p>
      <ul className="list-inside list-disc text-xs text-amber-100/85">
        {decoration.brokerCallouts.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <p className="text-[10px] text-amber-200/50">
        Boost ~{decoration.rankingBoostSuggestion != null ? (decoration.rankingBoostSuggestion * 100 - 100).toFixed(1) : "0"}% assist
        (internal) — not a public guarantee of placement.
      </p>
    </div>
  );
}
