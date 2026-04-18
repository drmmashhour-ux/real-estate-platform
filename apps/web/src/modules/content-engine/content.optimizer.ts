import { growthV3Flags } from "@/config/feature-flags";

export type VariantSuggestion = {
  key: string;
  text: string;
  rationale: string;
};

/**
 * Suggests alternate phrasing by reordering grounded facts — still no new facts.
 */
export function suggestVariantsFromSummary(base: string, city: string, priceLabel: string): VariantSuggestion[] {
  if (!growthV3Flags.contentEngineV1) return [];
  return [
    {
      key: "a",
      text: `${city}: ${priceLabel} — ${base}`,
      rationale: "City-first ordering for local SERP tests.",
    },
    {
      key: "b",
      text: `${priceLabel} in ${city} — ${base}`,
      rationale: "Price-first ordering for high-intent queries.",
    },
  ];
}
