import type { PrismaClient } from "@prisma/client";
import { answerCopilotQuestion } from "../infrastructure/copilotAI";
import { buildListingInsight } from "../infrastructure/listingAnalysisAI";

export async function runAiCoreCopilot(
  db: PrismaClient,
  input: { question: string; listingId?: string; leadId?: string }
) {
  let trustScore: number | null = null;
  let dealScore: number | null = null;
  let leadScore: number | null = null;
  let recommendations: string[] = [];

  if (input.listingId) {
    const listing = await db.fsboListing.findUnique({
      where: { id: input.listingId },
      select: { id: true, trustScore: true },
    });
    const lead = await db.lead.findFirst({
      where: { fsboListingId: input.listingId },
      orderBy: { createdAt: "desc" },
      select: { lecipmDealQualityScore: true },
    });
    trustScore = listing?.trustScore ?? null;
    dealScore = lead?.lecipmDealQualityScore ?? null;
    if (listing) {
      recommendations = buildListingInsight({
        listingId: listing.id,
        trustScore,
        dealScore,
      }).recommendations;
    }
  }

  if (input.leadId) {
    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
      select: { lecipmLeadScore: true, lecipmDealQualityScore: true, lecipmTrustScore: true },
    });
    leadScore = lead?.lecipmLeadScore ?? leadScore;
    dealScore = lead?.lecipmDealQualityScore ?? dealScore;
    trustScore = lead?.lecipmTrustScore ?? trustScore;
  }

  const out = answerCopilotQuestion({
    question: input.question,
    trustScore,
    dealScore,
    leadScore,
    recommendations,
  });

  return {
    answer: out.answer,
    nextActions: out.nextActions,
    context: { trustScore, dealScore, leadScore },
  };
}
