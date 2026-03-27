import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { OfferBand, OfferPosture } from "@/modules/deal-analyzer/domain/offerStrategy";
import type { UserStrategyMode } from "@/modules/deal-analyzer/domain/strategyModes";
import { negotiationRiskLevel } from "@/modules/deal-analyzer/infrastructure/services/negotiationRiskService";
import { computeOfferRangeCents } from "@/modules/deal-analyzer/infrastructure/services/offerRangeService";
import { buildSafeRecommendedConditions } from "@/modules/deal-analyzer/infrastructure/services/conditionRecommendationService";

function compConf(
  raw: string | null | undefined,
): "low" | "medium" | "high" | null {
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return null;
}

function derivePosture(args: {
  trustScore: number | null;
  riskScore: number;
  compConfidence: "low" | "medium" | "high" | null;
  positioningOutcome: string | null;
  strategyMode: UserStrategyMode | null | undefined;
}): (typeof OfferPosture)[keyof typeof OfferPosture] {
  if (!args.positioningOutcome || args.positioningOutcome === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA) {
    return OfferPosture.INSUFFICIENT_DATA;
  }
  const t = args.trustScore ?? 0;
  if (t < 45 || args.riskScore >= 68) return OfferPosture.CAUTIOUS;
  if (args.compConfidence === "low") return OfferPosture.CAUTIOUS;
  if (args.strategyMode === "buy_to_flip" && t >= 55) return OfferPosture.AGGRESSIVE;
  if (args.strategyMode === "buy_to_rent" && t >= 58) return OfferPosture.BALANCED;
  return OfferPosture.BALANCED;
}

function deriveOfferBand(args: {
  positioningOutcome: string | null;
  askVsMedian?: number | null;
}): (typeof OfferBand)[keyof typeof OfferBand] {
  const p = args.positioningOutcome;
  if (!p || p === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA) {
    return OfferBand.REVIEW_BELOW_ASK;
  }
  if (p === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    return OfferBand.ABOVE_ASK_REQUIRES_STRONG_JUSTIFICATION;
  }
  if (p === PricePositioningOutcome.BELOW_COMPARABLE_RANGE) {
    return OfferBand.REVIEW_BELOW_ASK;
  }
  return OfferBand.NEAR_ASK;
}

export function buildOfferStrategySnapshot(args: {
  askCents: number;
  trustScore: number | null;
  riskScore: number;
  positioningOutcome: string | null;
  comparablesSummaryConfidence: string | null | undefined;
  strategyMode?: UserStrategyMode | null;
}): {
  offerBand: string;
  offerPosture: string;
  suggestedMinOfferCents: number | null;
  suggestedTargetOfferCents: number | null;
  suggestedMaxOfferCents: number | null;
  confidenceLevel: "low" | "medium" | "high";
  competitionSignal: string | null;
  riskLevel: string;
  recommendedConditions: ReturnType<typeof buildSafeRecommendedConditions>;
  warnings: string[];
  explanation: string;
} {
  const cc = compConf(args.comparablesSummaryConfidence ?? undefined);
  const posture = derivePosture({
    trustScore: args.trustScore,
    riskScore: args.riskScore,
    compConfidence: cc,
    positioningOutcome: args.positioningOutcome,
    strategyMode: args.strategyMode,
  });
  const offerBand = deriveOfferBand({ positioningOutcome: args.positioningOutcome });
  const ranges = computeOfferRangeCents({
    askCents: args.askCents,
    compConfidence: cc,
    posture: posture === OfferPosture.INSUFFICIENT_DATA ? "insufficient_data" : posture,
  });

  const negRisk = negotiationRiskLevel({ trustScore: args.trustScore, riskScore: args.riskScore });
  const confidenceLevel: "low" | "medium" | "high" =
    posture === OfferPosture.INSUFFICIENT_DATA || cc === "low" ? "low" : cc === "high" ? "high" : "medium";

  const warnings: string[] = [
    dealAnalyzerConfig.phase3.disclaimers.offer,
  ];
  if (cc === "low") {
    warnings.push("Comparable confidence is limited — offer bands are wider and less precise.");
  }
  if ((args.trustScore ?? 0) < 50) {
    warnings.push("Lower listing trust/readiness may reduce seller flexibility — favor caution and verification.");
  }

  const explanation = [
    `Rules-based posture: ${posture}. Band guidance: ${offerBand.replace(/_/g, " ")}.`,
    `Negotiation difficulty signal: ${negRisk} (platform heuristics only).`,
  ].join(" ");

  return {
    offerBand,
    offerPosture: posture,
    suggestedMinOfferCents: ranges.min,
    suggestedTargetOfferCents: ranges.target,
    suggestedMaxOfferCents: ranges.max,
    confidenceLevel,
    competitionSignal: cc === "high" ? "tighter_platform_comparable_band" : cc === "low" ? "weak_comparable_coverage" : "moderate",
    riskLevel: negRisk,
    recommendedConditions: buildSafeRecommendedConditions({
      posture: posture === OfferPosture.INSUFFICIENT_DATA ? "cautious" : posture,
    }),
    warnings,
    explanation,
  };
}
