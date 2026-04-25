import type { GreenAiPerformanceLabel } from "./green.types";
import { greenAiLog } from "./green-ai-logger";

export type GreenPricingBoostLabelInfluence = "positive" | "neutral" | "negative";

export type GreenPricingBoostParams = {
  /** LECIPM internal label */
  performanceLabel: GreenAiPerformanceLabel | "GREEN" | "IMPROVABLE" | "LOW";
  improvementPotential?: "high" | "medium" | "low";
  /** Internal score 0–100 */
  quebecEsgScore?: number;
  /** Has credible upgrade path */
  hasUpgradePath?: boolean;
};

export type GreenPricingBoostSignal = {
  scoreInfluence: number;
  labelInfluence: GreenPricingBoostLabelInfluence;
  rankingBoostSuggestion: number | null;
  rationale: string[];
};

/**
 * Internal ranking/pricing intelligence only — not a public price recommendation.
 */
export function generateGreenPricingBoostSignal(params: GreenPricingBoostParams): GreenPricingBoostSignal {
  try {
    const label = String(params.performanceLabel).toUpperCase();
    const rationale: string[] = [];
    let scoreInfluence = 0;
    let labelInf: GreenPricingBoostLabelInfluence = "neutral";
    let ranking: number | null = 1.0;

    if (label === "GREEN") {
      scoreInfluence = 0.12;
      labelInf = "positive";
      ranking = 1.05;
      rationale.push("GREEN internal label supports mild positive discovery/ranking nudge.");
    } else if (label === "IMPROVABLE") {
      const pot = params.improvementPotential ?? "medium";
      if (pot === "high" && params.hasUpgradePath !== false) {
        scoreInfluence = 0.08;
        labelInf = "positive";
        ranking = 1.035;
        rationale.push("IMPROVABLE with high upgrade potential — small discovery boost; disclosures still required.");
      } else {
        scoreInfluence = 0.02;
        labelInf = "neutral";
        ranking = 1.015;
        rationale.push("IMPROVABLE with moderate potential — neutral-to-slight internal nudge.");
      }
    } else {
      scoreInfluence = -0.04;
      labelInf = "negative";
      ranking = 0.99;
      rationale.push("LOW internal label — avoid overstating efficiency; slight negative ranking bias for transparency.");
    }

    if (params.quebecEsgScore != null && params.quebecEsgScore >= 75) {
      rationale.push("Québec-inspired score tier supports efficiency positioning in copy (still non-official).");
    }

    greenAiLog.info("quebec_esg_pricing_boost_generated", {
      label,
      labelInfluence: labelInf,
      rankingBoostSuggestion: ranking,
    });

    return {
      scoreInfluence: Math.round(scoreInfluence * 1000) / 1000,
      labelInfluence: labelInf,
      rankingBoostSuggestion: ranking,
      rationale,
    };
  } catch {
    greenAiLog.warn("quebec_esg_pricing_boost_failed", { ok: false });
    return {
      scoreInfluence: 0,
      labelInfluence: "neutral",
      rankingBoostSuggestion: null,
      rationale: ["Pricing signal unavailable."],
    };
  }
}
