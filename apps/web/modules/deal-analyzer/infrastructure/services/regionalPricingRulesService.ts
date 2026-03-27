import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { RegionalProfileKey, type RegionalProfileId } from "@/modules/deal-analyzer/domain/regionalPricing";
import type { ComparableSearchOverrides } from "@/modules/deal-analyzer/infrastructure/services/comparablePropertyService";

export type RegionalPricingResult = {
  profileKey: RegionalProfileId;
  comparableSearchOverrides: ComparableSearchOverrides;
  positioningOverrides: { minGoodComps: number; minCompsForMediumConfidence: number };
  /** 0–1 confidence scale adjustment (subtract from internal weighting narratives). */
  dataSparsityPenalty: number;
  reasons: string[];
};

export function buildRegionalPricingRules(profile: RegionalProfileId, _regionLabel: string): RegionalPricingResult {
  const cfg = dealAnalyzerConfig.phase4.regional;
  const base = dealAnalyzerConfig.comparable;
  const reasons: string[] = [];

  if (profile === RegionalProfileKey.DENSE_URBAN) {
    reasons.push("Dense market profile: tighter geographic radius for comparables when coordinates exist.");
    return {
      profileKey: profile,
      comparableSearchOverrides: {
        maxRadiusKm: cfg.denseUrbanRadiusKm,
        priceBandFraction: Math.max(0.25, base.priceBandFraction - 0.05),
        maxCandidates: Math.min(base.maxCandidates, 70),
      },
      positioningOverrides: {
        minGoodComps: cfg.denseMinGoodComps,
        minCompsForMediumConfidence: base.minCompsForMediumConfidence,
      },
      dataSparsityPenalty: 0,
      reasons,
    };
  }

  if (profile === RegionalProfileKey.SPARSE) {
    reasons.push("Sparse market profile: wider search band; confidence is discounted when data is thin.");
    return {
      profileKey: profile,
      comparableSearchOverrides: {
        maxRadiusKm: cfg.sparseRadiusKm,
        priceBandFraction: Math.min(0.55, base.priceBandFraction + 0.08),
        maxCandidates: base.maxCandidates,
      },
      positioningOverrides: {
        minGoodComps: cfg.sparseMinGoodComps,
        minCompsForMediumConfidence: Math.max(3, base.minCompsForMediumConfidence - 1),
      },
      dataSparsityPenalty: cfg.lowDataConfidencePenalty,
      reasons,
    };
  }

  if (profile === RegionalProfileKey.SUBURBAN) {
    reasons.push("Suburban profile: moderate radius and default thresholds.");
    return {
      profileKey: profile,
      comparableSearchOverrides: {
        maxRadiusKm: cfg.suburbanRadiusKm,
        priceBandFraction: base.priceBandFraction,
        maxCandidates: base.maxCandidates,
      },
      positioningOverrides: {
        minGoodComps: base.minGoodComps,
        minCompsForMediumConfidence: base.minCompsForMediumConfidence,
      },
      dataSparsityPenalty: 0.05,
      reasons,
    };
  }

  reasons.push("Generic regional profile — platform defaults.");
  return {
    profileKey: RegionalProfileKey.GENERIC,
    comparableSearchOverrides: {},
    positioningOverrides: {
      minGoodComps: base.minGoodComps,
      minCompsForMediumConfidence: base.minCompsForMediumConfidence,
    },
    dataSparsityPenalty: 0.08,
    reasons,
  };
}
