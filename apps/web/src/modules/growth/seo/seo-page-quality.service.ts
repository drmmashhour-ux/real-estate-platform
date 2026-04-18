import type { SeoScoreComponents } from "../growth-v2.types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Deterministic SEO opportunity sub-scores from real inventory stats (0–100 each).
 * Does not claim market trends — only inventory-derived signals.
 */
export function computeSeoPageScores(input: {
  inventoryCount: number;
  distinctPropertyTypes: number;
  medianAgeDays: number;
  avgImageCount: number;
  duplicateSlugCount: number;
}): SeoScoreComponents {
  const invStrength = clamp01(Math.log1p(input.inventoryCount) / Math.log1p(120));
  const uniqueness = clamp01(input.distinctPropertyTypes / 6);
  const freshness = clamp01(1 - Math.min(1, input.medianAgeDays / 120));
  const contentSupport = clamp01(Math.min(1, input.avgImageCount / 8));
  const businessValue = clamp01(invStrength * 0.55 + freshness * 0.45);
  const internalLinking = clamp01(0.55 + 0.45 * uniqueness - input.duplicateSlugCount * 0.08);

  const overall =
    100 *
    clamp01(
      invStrength * 0.24 +
        uniqueness * 0.14 +
        freshness * 0.16 +
        contentSupport * 0.14 +
        businessValue * 0.18 +
        internalLinking * 0.14
    );

  return {
    inventoryStrengthScore: Math.round(100 * invStrength),
    uniquenessScore: Math.round(100 * uniqueness),
    freshnessScore: Math.round(100 * freshness),
    contentSupportScore: Math.round(100 * contentSupport),
    businessValueScore: Math.round(100 * businessValue),
    internalLinkingScore: Math.round(100 * internalLinking),
    overallSeoOpportunityScore: Math.round(overall),
  };
}
