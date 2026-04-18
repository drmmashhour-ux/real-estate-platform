/**
 * Advisory dynamic lead pricing V1 — display-only; does not change Stripe or checkout amounts.
 */

export type LeadPricingContext = {
  leadId: string;
  /** Whole CAD dollars from existing unlock pricing (`computeLeadValueAndPrice`). */
  basePrice: number;
  qualityScore: number;
  demandLevel: "low" | "medium" | "high";
  /** 0–100 — broker competition / fit density (routing or fallback heuristics). */
  brokerInterestLevel: number;
  /** Optional 0–1 platform conversion probability when present. */
  historicalConversion?: number;
};

export type DynamicPricingSuggestion = {
  basePrice: number;
  suggestedPrice: number;
  priceMultiplier: number;
  reason: string[];
  /** Echo for UI badges (e.g. “High demand lead”). */
  demandLevel: "low" | "medium" | "high";
};
