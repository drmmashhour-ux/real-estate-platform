import type {
  ConversionLiftOpportunity,
  PricingRecommendation,
  RankingOpportunity,
  VisibilityLeverageSignal,
} from "./market-domination.types";

export type RankingPricingInputs = {
  trustScoreHint?: number | null;
  legalRiskScoreHint?: number | null;
};

export function buildRankingOpportunities(_input: RankingPricingInputs): RankingOpportunity[] {
  return [];
}

export function buildPricingRecommendations(_input: RankingPricingInputs): PricingRecommendation[] {
  return [];
}

export function buildVisibilityLeverageSignals(_input: RankingPricingInputs): VisibilityLeverageSignal[] {
  return [];
}

export function buildConversionLiftOpportunities(_input: RankingPricingInputs): ConversionLiftOpportunity[] {
  return [];
}
