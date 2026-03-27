import type { PrismaClient } from "@prisma/client";
import { computeIncomeComponent, computeMarketComponent } from "@/modules/deal-analyzer/domain/scoring";
import { DealRecommendation } from "@/modules/deal-analyzer/domain/enums";
import type { DealAnalysisResult, DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";
import { confidenceMultiplier } from "@/modules/scoring/confidenceMultiplier";
import { confidenceMultiplierWithProfile, mergeElitePolicy, type TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { computeDealConfidence, comparableQualityScore } from "./dealConfidenceService";
import { computeNumericConflictPenalty } from "./dealConflictService";
import { pickEliteRecommendationWithPolicy } from "./eliteRecommendationPolicy";
import {
  dealScoreRawWeighted,
  riskLevelValueFromRiskScore,
  scoreCashFlow,
  scoreDemandStrength,
  scorePricePositioning,
  scoreReadinessFromTrust,
  scoreRoiQuality,
} from "./dealNumericTables";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export type EliteDealBreakdown = {
  pricePositioning: number;
  cashFlowPotential: number;
  roiQuality: number;
  demandStrength: number;
  readinessStrength: number;
};

export type EliteDealComputation = {
  dealScoreRaw: number;
  riskAdjustedDealScore: number;
  dealConfidence: number;
  finalDealScore: number;
  /** Platform risk score 0–100 (legacy aggregate) */
  riskScore: number;
  /** Risk level value used in deduction (10 / 30 / 60 / 80) */
  riskLevelValue: number;
  conflictPenalty: number;
  breakdown: EliteDealBreakdown;
  recommendation: (typeof DealRecommendation)[keyof typeof DealRecommendation];
  warnings: string[];
};

function estimatedAnnualRoiPercent(input: DealAnalyzerListingInput, incomeComponent: number | null): number | null {
  if (incomeComponent == null || input.priceCents <= 0) return null;
  const roughMonthlyRent = Math.round((input.priceCents / 100) * 0.0045);
  const y = roughMonthlyRent > 0 ? (roughMonthlyRent * 12) / (input.priceCents / 100) : 0;
  return y * 100;
}

export function pickEliteRecommendation(args: {
  dealConfidence: number;
  finalTrustScore: number;
  finalDealScore: number;
}): (typeof DealRecommendation)[keyof typeof DealRecommendation] {
  return pickEliteRecommendationWithPolicy(args, mergeElitePolicy(null));
}

/**
 * Numeric deal engine: table-based components, risk level deduction, banded confidence multiplier.
 */
export async function computeEliteDealComputation(
  db: PrismaClient,
  listingId: string,
  input: DealAnalyzerListingInput,
  baseResult: DealAnalysisResult,
  listingRow: {
    sellerDeclarationAiReviewJson: unknown;
    updatedAt: Date;
    city: string;
  },
  simulation?: { tuning?: TuningProfileConfig | null; fraudScore?: number | null },
): Promise<EliteDealComputation> {
  const lastAnalysis = await db.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const comparableCount = lastAnalysis
    ? await db.dealAnalysisComparable.count({ where: { analysisId: lastAnalysis.id } })
    : 0;

  const income = computeIncomeComponent(input);
  const market = computeMarketComponent(input);

  const pricePositioning = scorePricePositioning(input);
  const cashFlowPotential = scoreCashFlow(income);
  const annualRoi =
    baseResult.scenarioPreview?.annualRoiPercent != null
      ? Number(baseResult.scenarioPreview.annualRoiPercent)
      : estimatedAnnualRoiPercent(input, income);
  const roiQuality = scoreRoiQuality(annualRoi);
  const demandStrength = scoreDemandStrength(market);
  const readinessStrength = scoreReadinessFromTrust(input.trustScore);

  const dealScoreRaw = dealScoreRawWeighted({
    pricePositioning,
    cashFlowPotential,
    roiQuality,
    demandStrength,
    readinessStrength,
  });

  const ageMs = Date.now() - listingRow.updatedAt.getTime();
  const listingAgeDays = Math.max(0, Math.floor(ageMs / 86_400_000));
  const freshnessScore = clamp(listingAgeDays < 21 ? 88 : listingAgeDays < 60 ? 72 : 58);

  const demandReliability = market;

  const dealConfidence = computeDealConfidence({
    comparableCount,
    documentCompleteness: input.documentCompleteness,
    declarationCompleteness: input.declarationCompleteness,
    freshnessScore,
    demandReliability,
  });

  const riskLevelValue = riskLevelValueFromRiskScore(baseResult.riskScore);
  const riskDeduction = riskLevelValue * 0.2;

  const conflictPenalty = computeNumericConflictPenalty({
    trustScore: input.trustScore ?? 0,
    dealScoreRaw,
    dealConfidence,
  });

  const riskAdjustedDealScore = dealScoreRaw - riskDeduction - conflictPenalty;

  const tuning = simulation?.tuning ?? null;
  const mult = tuning?.confidenceMultiplierBands
    ? confidenceMultiplierWithProfile(dealConfidence, tuning.confidenceMultiplierBands)
    : confidenceMultiplier(dealConfidence);
  const finalDealScore = clamp(riskAdjustedDealScore * mult);

  const policy = mergeElitePolicy(tuning?.eliteRecommendation ?? undefined);
  const recommendation = pickEliteRecommendationWithPolicy(
    {
      dealConfidence,
      finalTrustScore: input.trustScore ?? 0,
      finalDealScore,
      fraudScore: simulation?.fraudScore ?? null,
      comparableCount,
    },
    policy,
  );

  const warnings: string[] = [];
  if (dealConfidence < 40) warnings.push("Low deal confidence — limited comparable or data coverage.");
  if (comparableQualityScore(comparableCount) < 55) warnings.push("Comparable set is thin — treat pricing as indicative only.");
  if ((input.trustScore ?? 0) < 50 && dealScoreRaw > 70) warnings.push("High modeled deal score with low trust — verify listing quality.");

  return {
    dealScoreRaw: clamp(dealScoreRaw),
    riskAdjustedDealScore: clamp(riskAdjustedDealScore),
    dealConfidence,
    finalDealScore,
    riskScore: baseResult.riskScore,
    riskLevelValue,
    conflictPenalty,
    breakdown: {
      pricePositioning: clamp(pricePositioning),
      cashFlowPotential: clamp(cashFlowPotential),
      roiQuality: clamp(roiQuality),
      demandStrength: clamp(demandStrength),
      readinessStrength: clamp(readinessStrength),
    },
    recommendation,
    warnings,
  };
}
