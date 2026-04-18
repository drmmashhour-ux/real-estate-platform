import type { MarketInsight } from "@/modules/market-intelligence/market-intelligence.types";

export function InsightFeed({ insights }: { insights: MarketInsight[] }) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card/90 p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-ds-text">Strategic insights</h2>
      <p className="mt-1 text-xs text-ds-text-secondary">
        Rule-based on internal metrics — each line lists source fields; not a predictive model.
      </p>
      <ul className="mt-4 space-y-4">
        {insights.map((i) => (
          <li key={i.id} className="border-b border-white/5 pb-4 last:border-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">{i.severity}</p>
            <p className="mt-1 font-medium text-ds-text">{i.title}</p>
            <p className="mt-1 text-sm text-ds-text-secondary">{i.detail}</p>
            <p className="mt-2 text-[10px] text-ds-text-secondary/80">Sources: {i.basedOn.join(", ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
