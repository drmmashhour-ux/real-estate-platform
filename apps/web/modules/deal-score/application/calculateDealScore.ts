import { DealRecommendation } from "@/modules/deal-analyzer/domain/enums";
import { runDeterministicDealScore } from "@/modules/deal-analyzer/infrastructure/services/dealScoringService";
import { runDealAnalysis } from "@/modules/deal-analyzer/application/runDealAnalysis";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import type { DealScoreResult } from "../domain/dealScore.types";
import { loadDealAnalyzerInputForListing } from "../infrastructure/dealDataService";
import { prisma } from "@/lib/db";
import { computeEliteDealComputation, type EliteDealComputation } from "../infrastructure/eliteDealScoring";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";

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

function fromElite(elite: EliteDealComputation): DealScoreResult {
  return {
    dealScore: elite.finalDealScore,
    dealScoreRaw: elite.dealScoreRaw,
    riskAdjustedDealScore: elite.riskAdjustedDealScore,
    dealConfidence: elite.dealConfidence,
    category: mapCategory(elite.finalDealScore),
    recommendation: mapRecommendation(elite.recommendation),
    riskScore: elite.riskScore,
    analyzerRecommendation: elite.recommendation,
    warnings: elite.warnings,
  };
}

export type CalculateDealScoreOptions = {
  persist?: boolean;
  tuning?: TuningProfileConfig | null;
};

/**
 * Confidence-aware deal score; persists `deal_analyses` with elite snapshot when enabled.
 */
export async function calculateDealScore(
  listingId: string,
  options?: CalculateDealScoreOptions
): Promise<DealScoreResult | null> {
  if (!isDealAnalyzerEnabled()) return null;
  const persist = options?.persist !== false;
  const tuning = options?.tuning ?? null;

  if (persist) {
    const out = await runDealAnalysis({ listingId });
    if (!out.ok) return null;
    return fromElite(out.elite);
  }

  const input = await loadDealAnalyzerInputForListing(listingId);
  if (!input) return null;

  const listingRow = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { sellerDeclarationAiReviewJson: true, updatedAt: true, city: true },
  });
  if (!listingRow) return null;

  let inputForDeal = input;
  if (tuning != null) {
    const tr = await calculateTrustScore(prisma, listingId, { persist: false, tuning });
    if (tr) inputForDeal = { ...input, trustScore: tr.trustScore };
  }

  const base = runDeterministicDealScore(inputForDeal);
  const sim =
    tuning != null
      ? { tuning, fraudScore: (await calculateFraudScore(prisma, listingId))?.fraudScore ?? null }
      : undefined;
  const elite = await computeEliteDealComputation(prisma, listingId, inputForDeal, base, listingRow, sim);
  return fromElite(elite);
}
