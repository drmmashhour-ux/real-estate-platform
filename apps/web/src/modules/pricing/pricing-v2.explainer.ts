import type { RecommendPriceV2Result } from "./pricing-v2.types";

export function expectedImpactFsbo(lowConfidence: boolean): RecommendPriceV2Result["expectedImpact"] {
  return {
    revenue: lowConfidence
      ? "Wide band — treat any revenue effect as illustrative until comparable volume improves."
      : "If demand responds, list-price changes can affect offer cadence — not guaranteed.",
    visibility: "Price position vs internal peers can influence ranking blend where enabled.",
    competitiveness: "Closer alignment with peer cluster often improves relative competitiveness score.",
  };
}

export function expectedImpactBnhub(lowConfidence: boolean): RecommendPriceV2Result["expectedImpact"] {
  return {
    revenue: lowConfidence
      ? "Occupancy response to nightly changes is uncertain — do not treat as guaranteed income."
      : "Illustrative revenue effect depends on booking conversion and calendar — modeled, not promised.",
    visibility: "Nightly rate feeds discovery cards; sharp moves may affect booking friction.",
    competitiveness: "Balanced vs peers (internal sample) supports sustainable positioning.",
  };
}
