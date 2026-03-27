import type { PrismaClient } from "@prisma/client";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import { combineLecipmScores, computeUrgencyScore } from "../infrastructure/leadScoringService";

/**
 * Recompute LECIPM CRM scores from Trust + Deal engines + engagement (persists on Lead).
 */
export async function recalculateLeadLecipmScores(db: PrismaClient, leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  let trustScore: number | null = null;
  let dealQuality: number | null = null;

  if (lead.fsboListingId) {
    const listing = await db.fsboListing.findUnique({
      where: { id: lead.fsboListingId },
      select: { trustScore: true },
    });
    trustScore = listing?.trustScore ?? null;
    if (trustScore == null) {
      const tr = await calculateTrustScore(db, lead.fsboListingId, { persist: false });
      trustScore = tr?.trustScore ?? null;
    }
    if (isDealAnalyzerEnabled()) {
      const dto = await getDealAnalysisPublicDto(lead.fsboListingId);
      dealQuality = dto?.investmentScore ?? null;
    }
  }

  const urgency = computeUrgencyScore(lead);
  const breakdown = combineLecipmScores({
    trustScore,
    dealQualityScore: dealQuality,
    urgencyScore: urgency,
    legacyScore: lead.score,
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      lecipmLeadScore: breakdown.leadScore,
      lecipmDealQualityScore: breakdown.dealQualityScore,
      lecipmTrustScore: breakdown.trustScore,
      lecipmUrgencyScore: breakdown.urgencyScore,
      lecipmScoresComputedAt: new Date(),
    },
  });

  return breakdown;
}
