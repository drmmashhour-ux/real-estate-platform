import { DealAllocationInput } from "./capital-allocator.types";

/**
 * PHASE 2: DEAL SCORING NORMALIZATION
 * Combines various factors into a single normalized score (0-1).
 */
export class CapitalDealScoringService {
  /**
   * Normalizes a deal score based on underwriting, ESG, financing, and compliance.
   */
  static normalizeDealScore(deal: DealAllocationInput): number {
    // 1. Base Weights (can be adjusted by strategy in the engine)
    const weights = {
      underwriting: 0.4,
      esg: 0.2,
      financing: 0.2,
      compliance: 0.2,
    };

    // 2. Base Score Calculation
    let score = 
      (deal.underwritingScore * weights.underwriting) +
      (deal.esgScore * weights.esg) +
      (deal.financingAvailability * weights.financing) +
      (deal.complianceScore * weights.compliance);

    // 3. Risk Penalties
    if (deal.riskLevel === "HIGH") {
      score *= 0.7; // 30% penalty for high risk
    } else if (deal.riskLevel === "MEDIUM") {
      score *= 0.9; // 10% penalty for medium risk
    }

    // 4. Stage Confidence
    const stageConfidence: Record<string, number> = {
      "COMMITMENT": 1.0,
      "DILIGENCE": 0.9,
      "SCREENING": 0.7,
    };
    
    const confidence = stageConfidence[deal.dealStage.toUpperCase()] || 0.5;
    score *= confidence;

    // 5. Final Clamp
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generates a rationale for why a deal received its score.
   */
  static generateRationale(deal: DealAllocationInput, normalizedScore: number): string {
    const factors = [];
    if (deal.underwritingScore > 0.8) factors.push("strong underwriting signals");
    if (deal.esgScore > 0.8) factors.push("exceptional ESG profile");
    if (deal.financingAvailability > 0.8) factors.push("high financing availability");
    if (deal.complianceScore > 0.9) factors.push("excellent compliance posture");
    
    let base = `Normalized score of ${(normalizedScore * 100).toFixed(1)}% derived from ${factors.join(", ") || "balanced fundamentals"}.`;
    
    if (deal.riskLevel === "HIGH") {
      base += " Note: Score penalized due to high risk profile.";
    }

    return base;
  }
}
