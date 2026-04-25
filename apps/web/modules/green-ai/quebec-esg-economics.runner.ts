import type { GreenEngineInput } from "@/modules/green/green.types";
import type { GreenAiPerformanceLabel } from "./green.types";
import { evaluateQuebecEsg, type QuebecEsgResult } from "./quebec-esg.engine";
import { generateQuebecEsgRecommendations, type QuebecEsgRecommendation } from "./quebec-esg-recommendation.service";
import { simulateQuebecEsgUpgrade } from "./quebec-esg-simulator.service";
import { estimateQuebecEsgUpgradeCosts, type QuebecEsgCostEstimateResult } from "./quebec-esg-cost.service";
import { estimateQuebecEsgIncentives, type QuebecEsgIncentiveEstimateResult } from "./quebec-esg-incentive.service";
import { calculateQuebecEsgRetrofitRoi, type QuebecEsgRetrofitRoiResult } from "./quebec-esg-roi.service";
import { generateGreenPricingBoostSignal, type GreenPricingBoostSignal } from "./quebec-esg-pricing-boost.service";

function quebecLabelToPerformanceLabel(q: QuebecEsgResult["label"]): GreenAiPerformanceLabel {
  if (q === "GREEN") return "GREEN";
  if (q === "LOW") return "LOW";
  return "IMPROVABLE";
}

export type QuebecEsgEconomicsRunResult = {
  evaluation: QuebecEsgResult;
  recommendations: QuebecEsgRecommendation[];
  simulation: ReturnType<typeof simulateQuebecEsgUpgrade>;
  costEstimates: QuebecEsgCostEstimateResult;
  incentives: QuebecEsgIncentiveEstimateResult;
  roi: QuebecEsgRetrofitRoiResult;
  pricingBoost: GreenPricingBoostSignal;
};

/**
 * Full deterministic economics pass for Québec ESG recommendations. Never throws.
 */
export function runQuebecEsgEconomicsPipeline(
  input: GreenEngineInput,
  options?: {
    recommendationKeys?: string[];
    historyMode?: boolean;
    optionalListingPriceCad?: number | null;
    propertyType?: string | null;
  },
): QuebecEsgEconomicsRunResult | null {
  try {
    const evaluation = evaluateQuebecEsg(input);
    const { recommendations: all } = generateQuebecEsgRecommendations(input, evaluation);
    const keys = options?.recommendationKeys?.filter(Boolean);
    const recommendations = keys?.length ? all.filter((r) => keys.includes(r.key)) : all;
    const simulation = simulateQuebecEsgUpgrade(input, recommendations.map((r) => r.key));
    const costEstimates = estimateQuebecEsgUpgradeCosts(recommendations, input);
    const incentives = estimateQuebecEsgIncentives(recommendations, input, { historyMode: options?.historyMode });
    const roi = calculateQuebecEsgRetrofitRoi({
      currentEvaluationScore: evaluation.score,
      projectedEvaluationScore: simulation.projectedScore,
      costEstimates,
      incentiveEstimates: incentives,
      optionalListingPriceCad: options?.optionalListingPriceCad ?? null,
      propertyType: options?.propertyType ?? input.propertyType ?? null,
    });
    const improvementPotential =
      simulation.delta >= 15 ? ("high" as const) : simulation.delta >= 8 ? ("medium" as const) : ("low" as const);
    const pricingBoost = generateGreenPricingBoostSignal({
      performanceLabel: quebecLabelToPerformanceLabel(evaluation.label),
      improvementPotential,
      quebecEsgScore: evaluation.score,
      hasUpgradePath: recommendations.length > 0,
    });
    return {
      evaluation,
      recommendations,
      simulation,
      costEstimates,
      incentives,
      roi,
      pricingBoost,
    };
  } catch {
    return null;
  }
}
