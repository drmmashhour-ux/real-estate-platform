import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { DealRecommendation } from "@/modules/deal-analyzer/domain/enums";
import type { DealScoreResult } from "../domain/dealScore.types";

function mapCategory(score: number): DealScoreResult["category"] {
  if (score < 40) return "bad";
  if (score < 55) return "average";
  if (score < 72) return "good";
  return "excellent";
}

function mapRecommendation(r: string): DealScoreResult["recommendation"] {
  if (r === DealRecommendation.INSUFFICIENT_DATA) return "insufficient_data";
  if (r === DealRecommendation.CAUTION) return "caution";
  if (r === DealRecommendation.STRONG_OPPORTUNITY) return "strong_opportunity";
  if (r === DealRecommendation.WORTH_REVIEWING) return "worth_reviewing";
  if (r === DealRecommendation.AVOID) return "avoid";
  return "caution";
}

/** Optional elite snapshot stored on `deal_analyses.summary.elite` */
type EliteSummary = {
  dealScoreRaw?: number;
  riskAdjustedDealScore?: number;
  dealConfidence?: number;
  warnings?: string[];
};

export function dealScoreResultFromPublicDto(
  dto: DealAnalysisPublicDto,
  summaryElite?: EliteSummary | null
): DealScoreResult {
  const e = summaryElite ?? {};
  const score = dto.investmentScore;
  return {
    dealScore: score,
    dealScoreRaw: e.dealScoreRaw ?? score,
    riskAdjustedDealScore: e.riskAdjustedDealScore ?? score,
    dealConfidence: e.dealConfidence ?? 50,
    category: mapCategory(score),
    recommendation: mapRecommendation(dto.recommendation),
    riskScore: dto.riskScore,
    analyzerRecommendation: dto.recommendation,
    warnings: Array.isArray(e.warnings) ? e.warnings : undefined,
  };
}
