import { VerificationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto, getLatestDealAnalysisRecord } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { dealScoreResultFromPublicDto } from "@/modules/deal-score/adapters/fromDealAnalysisDto";
import { generateExplanation } from "@/modules/ai-explanations/generateExplanation";
import type { DecisionExplanation } from "@/modules/ai-explanations/generateExplanation";
import type { TrustScoreResult } from "@/modules/trust-score/domain/trustScore.types";
import type { DealScoreResult } from "@/modules/deal-score/domain/dealScore.types";
import { trustResultFromListingAndCaseSummary } from "./trustSnapshot";

export type DecisionSnapshot = {
  trust: TrustScoreResult;
  deal: DealScoreResult;
  explanation: DecisionExplanation;
};

type EliteSummary = {
  dealScoreRaw?: number;
  riskAdjustedDealScore?: number;
  dealConfidence?: number;
};

/**
 * Read-through snapshot for seller UI: trust from listing + latest verification case;
 * deal from latest persisted analysis or a non-persisted deterministic score.
 */
export async function buildDecisionSnapshotForListing(listingId: string): Promise<DecisionSnapshot | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { trustScore: true },
  });
  if (!listing) return null;

  const vcase = await prisma.verificationCase.findFirst({
    where: { entityType: VerificationEntityType.LISTING, entityId: listingId },
    orderBy: { updatedAt: "desc" },
    select: { summary: true, overallScore: true },
  });
  const summary = vcase?.summary as {
    issues?: string[];
    strengths?: string[];
    issueCodes?: string[];
    strengthCodes?: string[];
  } | null;
  const trust = trustResultFromListingAndCaseSummary({
    trustScore: listing.trustScore,
    overallCaseScore: vcase?.overallScore,
    summary,
  });

  if (!isDealAnalyzerEnabled()) return null;

  const dealDto = await getDealAnalysisPublicDto(listingId);
  const lastRow = await getLatestDealAnalysisRecord(listingId);
  const dealSummary = lastRow?.summary as { elite?: EliteSummary } | undefined;
  const deal = dealDto
    ? dealScoreResultFromPublicDto(dealDto, dealSummary?.elite)
    : await calculateDealScore(listingId, { persist: false });
  if (!deal) return null;

  const extraWarnings = dealDto?.warnings ?? [];
  const explanation = await generateExplanation({ trust, deal, extraWarnings });
  return { trust, deal, explanation };
}
