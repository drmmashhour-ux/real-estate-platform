import type { OptimizationDecision } from "./optimizer";

type SuggestionsWithDynamic = {
  dynamicPrice?: OptimizationDecision;
};

/**
 * Only allows automatic apply for small pricing nudges; never for blind title rewrite.
 * Max 10% change per {@link canAutoApply} rules.
 */
export function canAutoApply(suggestions: SuggestionsWithDynamic | Record<string, unknown>): boolean {
  const dyn = (suggestions as SuggestionsWithDynamic).dynamicPrice;
  if (dyn && typeof dyn === "object" && "changePct" in dyn) {
    const pct = (dyn as OptimizationDecision).changePct;
    return typeof pct === "number" && Number.isFinite(pct) && pct <= 0.1;
  }
  return false;
}
