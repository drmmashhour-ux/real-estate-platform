/** Advisory domination layer — deterministic explainers only; no black-box scores. */

export type RankingOpportunity = {
  id: string;
  title: string;
  explanation: string;
  priority: "low" | "medium" | "high";
};

export type PricingRecommendation = {
  id: string;
  listingIdHint?: string | null;
  suggestionSummary: string;
  advisoryOnly: true;
};

export type VisibilityLeverageSignal = {
  id: string;
  signal: string;
  explain: string;
};

export type ConversionLiftOpportunity = {
  id: string;
  channel: string;
  liftHint: string;
};

export type DominationSummary = {
  ranking: RankingOpportunity[];
  pricing: PricingRecommendation[];
  visibility: VisibilityLeverageSignal[];
  conversion: ConversionLiftOpportunity[];
  notes: string[];
};
