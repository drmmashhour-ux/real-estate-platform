import { prisma } from "@/lib/db";
import { RetrofitStrategyType } from "@/modules/esg/esg-retrofit.types";

export interface InvestmentScoringInput {
  financialScore: number; // 0-100
  listingId: string;
}

export interface InvestmentScoringResult {
  riskAdjustedScore: number;
  capexBurdenScore: number;
  upgradeUpsideScore: number;
  financingFitScore: number;
  factors: string[];
}

const COST_BAND_PENALTY: Record<string, number> = {
  "LOW": 0,
  "MEDIUM": -5,
  "HIGH": -15,
  "UNKNOWN": -5,
};

const IMPACT_BAND_BOOST: Record<string, number> = {
  "INCREMENTAL": 2,
  "MODERATE": 8,
  "MATERIAL": 15,
};

/**
 * Implementation of the ESG-driven Investment Scoring Layer.
 * Integrates Capex burden, Upgrade upside, and Financing fit into a risk-adjusted score.
 */
export class InvestmentScoringService {
  static async calculateRiskAdjustedScore(input: InvestmentScoringInput): Promise<InvestmentScoringResult> {
    const { financialScore, listingId } = input;
    
    // 1. Fetch ESG data context
    const [esgProfile, optimizedPlan] = await Promise.all([
      prisma.esgProfile.findUnique({ where: { listingId } }),
      prisma.esgRetrofitPlan.findFirst({ 
        where: { listingId, strategyType: "OPTIMIZED" },
        include: { financingOptions: true }
      })
    ]);

    let capexBurdenScore = 0;
    let upgradeUpsideScore = 0;
    let financingFitScore = 0;
    const factors: string[] = [];

    // 2. Evaluate Capex Burden
    if (optimizedPlan?.totalEstimatedCostBand) {
      capexBurdenScore = COST_BAND_PENALTY[optimizedPlan.totalEstimatedCostBand] || 0;
      if (capexBurdenScore < -10) factors.push("Significant capex burden for energy transition");
    }

    // 3. Evaluate Upgrade Upside
    if (optimizedPlan?.totalEstimatedImpactBand) {
      upgradeUpsideScore = IMPACT_BAND_BOOST[optimizedPlan.totalEstimatedImpactBand] || 0;
      if (upgradeUpsideScore > 10) factors.push("High value creation potential via retrofits");
    }

    // 4. Evaluate Financing Fit (Green Financing Matcher)
    if (optimizedPlan?.financingOptions && optimizedPlan.financingOptions.length > 0) {
      // More options = better fit
      financingFitScore = Math.min(10, optimizedPlan.financingOptions.length * 2);
      factors.push(`Eligible for ${optimizedPlan.financingOptions.length} green financing programs`);
    }

    // 5. Final Risk-Adjusted Calculation
    // Base financial score adjusted by ESG delta
    const esgDelta = capexBurdenScore + upgradeUpsideScore + financingFitScore;
    let riskAdjustedScore = financialScore + esgDelta;

    // Penalty for missing ESG data if it's a high-impact property
    if (!esgProfile) {
      riskAdjustedScore -= 5;
      factors.push("ESG data gap penalty applied");
    }

    return {
      riskAdjustedScore: Math.max(0, Math.min(100, riskAdjustedScore)),
      capexBurdenScore,
      upgradeUpsideScore,
      financingFitScore,
      factors
    };
  }
}
