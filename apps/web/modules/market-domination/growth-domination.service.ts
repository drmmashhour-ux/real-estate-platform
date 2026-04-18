import { engineFlags } from "@/config/feature-flags";
import type { DominationSummary } from "./market-domination.types";
import {
  buildConversionLiftOpportunities,
  buildPricingRecommendations,
  buildRankingOpportunities,
  buildVisibilityLeverageSignals,
} from "./ranking-pricing-intelligence.service";

export function buildDominationSummary(input: { trustScoreHint?: number | null; legalRiskScoreHint?: number | null }): DominationSummary {
  return {
    ranking: buildRankingOpportunities(input),
    pricing: buildPricingRecommendations(input),
    visibility: buildVisibilityLeverageSignals(input),
    conversion: buildConversionLiftOpportunities(input),
    notes: engineFlags.marketDominationV1 ? ["advisory_surface_enabled"] : ["feature_disabled"],
  };
}

export function buildRegionalExpansionTargets(): { regions: string[]; notes: string[] } {
  return { regions: [], notes: ["not_configured"] };
}

export function buildBrokerAcquisitionOpportunities(): { items: string[] } {
  return { items: [] };
}

export function buildTrustDrivenVisibilityOpportunities(): { items: string[] } {
  return { items: [] };
}
