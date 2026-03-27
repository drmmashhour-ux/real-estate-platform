import type { IntelligenceSignals, SelectionItem } from "@/src/core/intelligence/types/intelligence.types";

export function buildExplanation(args: { signals: IntelligenceSignals; selection: SelectionItem[] }) {
  const topSignals = [
    args.signals.price_vs_market,
    args.signals.rental_demand,
    args.signals.location_score,
    args.signals.document_completeness,
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((s) => `${s.key.replace(/_/g, " ")}: ${s.value}`);

  const action = args.selection[0]?.recommendedAction ?? "analyze_more";
  return {
    short: `Top deterministic factors support ${action.replace(/_/g, " ")}.`,
    keyFactors: topSignals,
    recommendedAction: action,
  };
}
