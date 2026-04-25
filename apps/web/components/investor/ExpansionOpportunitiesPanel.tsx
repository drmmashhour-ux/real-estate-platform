"use client";

import type { InvestmentOpportunity, MarketExpansionCandidate, InvestmentRisk } from "@/modules/investor-intelligence/investor-intelligence.types";

type Props = {
  markets: MarketExpansionCandidate[];
  segments: InvestmentOpportunity[];
  risks: InvestmentRisk[];
  capacity: string[];
  className?: string;
};

export function ExpansionOpportunitiesPanel({ markets, segments, risks, capacity, className }: Props) {
  return (
    <div className={`space-y-3 ${className ?? ""}`} data-testid="expansion-opp">
      <h3 className="text-sm font-medium text-slate-800">Expansion (observational)</h3>
      <ul className="list-inside list-disc text-sm text-slate-600">
        {markets.slice(0, 5).map((m) => (
          <li key={m.marketKey}>
            {m.marketKey} — {m.wonDeals} won in lookback; avg~{m.avgValue == null ? "n/a" : Math.round(m.avgValue)}
          </li>
        ))}
        {markets.length === 0 ? <li>Insufficient market data.</li> : null}
      </ul>
      {capacity.length > 0 ? (
        <p className="text-xs text-amber-800">{capacity[0]}</p>
      ) : null}
      {risks.length > 0 ? <p className="text-xs text-rose-700">Risk: {risks[0]!.message}</p> : null}
    </div>
  );
}
