import type { PricingRecommendation } from "@/modules/market-domination/market-domination.types";

export function PricingRecommendationCard(props: { items: PricingRecommendation[] }) {
  if (!props.items.length) {
    return <p className="text-sm text-slate-500">No advisory pricing rows — pipeline returns deterministic empties until wired.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {props.items.map((p) => (
        <li key={p.id} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
          {p.suggestionSummary}{" "}
          <span className="text-xs text-slate-500">(advisory only)</span>
        </li>
      ))}
    </ul>
  );
}
