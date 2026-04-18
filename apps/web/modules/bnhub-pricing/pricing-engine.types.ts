export type BnhubPricingSuggestion = {
  suggestedPriceCents: number;
  minPriceCents: number;
  maxPriceCents: number;
  confidence: number;
  confidenceLabel: "low" | "medium" | "high";
  reasons: string[];
};
