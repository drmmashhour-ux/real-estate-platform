import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AnalysisMode } from "@/modules/deal-analyzer/domain/enums";
import { buildDealAnalyzerListingInput } from "@/modules/deal-analyzer/infrastructure/services/listingInputBuilder";
import { runDeterministicDealScore } from "@/modules/deal-analyzer/infrastructure/services/dealScoringService";
import { buildExplanationText } from "@/modules/deal-analyzer/infrastructure/services/dealExplanationService";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { computeEliteDealComputation } from "@/modules/deal-score/infrastructure/eliteDealScoring";

/**
 * Computes deterministic scores and persists deal_analyses + factors (+ optional scenario row).
 */
export async function runDealAnalysis(args: { listingId: string; analysisType?: string }) {
  if (!isDealAnalyzerEnabled()) {
    return { ok: false as const, error: "Deal Analyzer is disabled" };
  }

  const input = await buildDealAnalyzerListingInput(args.listingId);
  if (!input) {
    return { ok: false as const, error: "Listing not found" };
  }

  const listingRow = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    select: { sellerDeclarationAiReviewJson: true, updatedAt: true, city: true },
  });
  if (!listingRow) {
    return { ok: false as const, error: "Listing not found" };
  }

  const result = runDeterministicDealScore(input);
  const elite = await computeEliteDealComputation(prisma, args.listingId, input, result, listingRow);
  const mergedResult = {
    ...result,
    investmentScore: elite.finalDealScore,
    recommendation: elite.recommendation,
  };
  const explanation = buildExplanationText(mergedResult);

  const summary = {
    components: result.components,
    reasons: result.reasons,
    warnings: result.warnings,
    elite: {
      dealScoreRaw: elite.dealScoreRaw,
      riskAdjustedDealScore: elite.riskAdjustedDealScore,
      dealConfidence: elite.dealConfidence,
      finalDealScore: elite.finalDealScore,
      conflictPenalty: elite.conflictPenalty,
      riskLevelValue: elite.riskLevelValue,
      breakdown: elite.breakdown,
      recommendation: elite.recommendation,
      warnings: elite.warnings,
    },
  };

  const row = await prisma.$transaction(async (tx) => {
    const analysis = await tx.dealAnalysis.create({
      data: {
        propertyId: args.listingId,
        analysisType: args.analysisType ?? AnalysisMode.LISTING,
        investmentScore: elite.finalDealScore,
        riskScore: result.riskScore,
        confidenceScore: Math.min(100, Math.max(0, Math.round(elite.dealConfidence))),
        recommendation: elite.recommendation,
        opportunityType: result.opportunityType,
        summary: summary as object,
        explanation,
      },
    });

    for (const f of result.factors) {
      await tx.dealAnalysisFactor.create({
        data: {
          analysisId: analysis.id,
          factorCode: f.factorCode,
          factorCategory: f.factorCategory,
          factorValue: f.factorValue,
          weight: new Prisma.Decimal(f.weight.toFixed(4)),
          impact: f.impact,
          details: f.details as object,
        },
      });
    }

    if (result.scenarioPreview) {
      await tx.dealAnalysisScenario.create({
        data: {
          analysisId: analysis.id,
          scenarioType: result.scenarioPreview.scenarioType,
          monthlyRent: result.scenarioPreview.monthlyRent,
          occupancyRate:
            result.scenarioPreview.occupancyRate != null
              ? new Prisma.Decimal(result.scenarioPreview.occupancyRate.toFixed(4))
              : null,
          monthlyCashFlow: result.scenarioPreview.monthlyCashFlow,
          annualRoi: null,
          capRate: null,
        },
      });
    }

    return analysis;
  });

  return { ok: true as const, analysisId: row.id, result: mergedResult, elite };
}
