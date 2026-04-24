import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { runAcquisitionAnalysis } from "@/modules/investment/acquisition.service";
import type { UnderwritingInput } from "@/modules/investment/underwriting.types";
import { getLatestListingIntelligenceSnapshot } from "@/lib/ai/intelligence/getLatestListingIntelligence";
import { InvestmentScoringService } from "./investment-scoring.service";

const TAG = "[investment-ai]";
const COOLDOWN_SECONDS = 300; // 5 minutes

export interface UnderwritingOptions {
  source?: "INITIAL" | "ARTIFACTS_REFRESH" | "MANUAL_REFRESH";
  force?: boolean;
}

/**
 * Runs underwriting for a deal and attaches the results to the record.
 * Persists a snapshot for versioning.
 */
export async function runAndAttachUnderwritingToDeal(dealId: string, opts?: UnderwritingOptions) {
  const source = opts?.source || "MANUAL_REFRESH";
  logInfo(TAG, { action: "underwriting_refresh_triggered", dealId, source });
  
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    include: { 
      listing: { 
        include: { 
          esgProfile: true 
        } 
      } 
    }
  });

  if (!deal) {
    logInfo(TAG, { dealId, message: "Deal not found for underwriting" });
    return;
  }

  // Guard: cooldown to avoid redundant runs
  if (!opts?.force && deal.underwritingUpdatedAt) {
    const elapsed = (Date.now() - deal.underwritingUpdatedAt.getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      logInfo(TAG, { dealId, action: "underwriting_skipped_recent", elapsed });
      return;
    }
  }

  try {
    const context = await buildUnderwritingContext(deal);
    const financialAnalysis = runAcquisitionAnalysis(context);

    // Investment Scoring Layer: Financial + ESG (Capex, Upside, Financing)
    const scoring = await InvestmentScoringService.calculateRiskAdjustedScore({
      financialScore: financialAnalysis.score,
      listingId: deal.listingId || ""
    });

    const finalScore = scoring.riskAdjustedScore;
    
    let label: "WEAK" | "MODERATE" | "STRONG" = "MODERATE";
    let recommendation: "BUY" | "BUY_WITH_RETROFIT_PLAN" | "HOLD" | "AVOID" = "HOLD";

    // Deal Underwriting AI: Stance Determination
    if (finalScore >= 75) {
      label = "STRONG";
      recommendation = "BUY";
    } else if (finalScore >= 60) {
      label = "MODERATE";
      recommendation = "BUY_WITH_RETROFIT_PLAN";
    } else if (finalScore >= 40) {
      label = "MODERATE";
      recommendation = "HOLD";
    } else {
      label = "WEAK";
      recommendation = "AVOID";
    }

    const payload = {
      analysis: financialAnalysis,
      scoring,
      context,
      timestamp: new Date().toISOString()
    };

    await prisma.$transaction([
      prisma.investmentPipelineDeal.update({
        where: { id: dealId },
        data: {
          underwritingScore: finalScore,
          underwritingLabel: label,
          underwritingRecommendation: recommendation,
          underwritingConfidence: financialAnalysis.confidenceScore > 0.8 ? "high" : financialAnalysis.confidenceScore > 0.6 ? "medium" : "low",
          underwritingSummaryJson: {
            reasoning: financialAnalysis.result.reasoning,
            roi: financialAnalysis.result.roi,
            capRate: financialAnalysis.result.capRate,
            cashFlow: financialAnalysis.result.cashFlowMonthly,
            esgFactors: scoring.factors
          } as any,
          underwritingRisksJson: {
            description: financialAnalysis.scenarios.pessimistic.description,
            roi: financialAnalysis.scenarios.pessimistic.result.roi,
            capexBurden: scoring.capexBurdenScore
          } as any,
          underwritingUpsideJson: {
            description: financialAnalysis.scenarios.optimistic.description,
            roi: financialAnalysis.scenarios.optimistic.result.roi,
            upgradeUpside: scoring.upgradeUpsideScore,
            financingFit: scoring.financingFitScore
          } as any,
          underwritingUpdatedAt: new Date(),
        }
      }),
      prisma.dealUnderwritingSnapshot.create({
        data: {
          dealId,
          source,
          payloadJson: payload as any
        }
      })
    ]);

    logInfo(TAG, { 
      action: "underwriting_attached_to_deal", 
      dealId, 
      score: finalScore, 
      label,
      source 
    });

  } catch (error) {
    logInfo(TAG, { dealId, action: "underwriting_failed", error: String(error) });
  }
}

async function buildUnderwritingContext(deal: any): Promise<Partial<UnderwritingInput>> {
  const listing = deal.listing;
  if (!listing) return { purchasePrice: 0, adr: 250, occupancyRate: 0.65, monthlyCost: 1500 };

  // Try to find DealAnalysis with BNHub data if listing is not a short term listing itself
  const analysis = await prisma.dealAnalysis.findFirst({
    where: { 
      OR: [
        { propertyId: listing.id },
        { shortTermListingId: listing.id }
      ]
    },
    include: { scenarios: true },
    orderBy: { createdAt: "desc" }
  });

  const expectedScenario = analysis?.scenarios.find(s => s.scenarioType === "expected");
  const intel = await getLatestListingIntelligenceSnapshot(listing.id);
  
  // Heuristics for missing values
  const purchasePrice = listing.price || 0;
  
  // ADR logic
  let adr = 250; // default
  if (expectedScenario?.details && (expectedScenario.details as any).adr) {
    adr = (expectedScenario.details as any).adr;
  } else if (intel?.suggestedPrice) {
    adr = intel.suggestedPrice;
  }
  
  // Occupancy logic
  let occupancyRate = 0.65; // default
  if (expectedScenario?.occupancyRate) {
    occupancyRate = Number(expectedScenario.occupancyRate);
  } else if (intel?.occupancyRate) {
    occupancyRate = intel.occupancyRate;
  }

  // Cost logic
  let monthlyCost = 1500; // default
  if (expectedScenario?.operatingCost) {
    monthlyCost = expectedScenario.operatingCost / 100;
  }

  return {
    purchasePrice,
    adr,
    occupancyRate,
    monthlyCost,
  };
}
