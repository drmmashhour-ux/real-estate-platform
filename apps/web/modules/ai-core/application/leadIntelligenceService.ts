import type { PrismaClient } from "@prisma/client";
import { computeUrgencyScore } from "@/modules/crm/infrastructure/leadScoringService";
import { calculateAiLeadScore, predictCloseLikelihood } from "../infrastructure/leadScoringAI";
import type { AiLeadInsight } from "../domain/types";

export async function getLeadIntelligence(
  db: PrismaClient,
  leadId: string
): Promise<AiLeadInsight | null> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return null;

  const leadScore = calculateAiLeadScore({
    dealScore: lead.lecipmDealQualityScore,
    trustScore: lead.lecipmTrustScore,
    engagement: lead.engagementScore,
  });
  const urgency = computeUrgencyScore(lead);
  const closeLikelihood = predictCloseLikelihood({
    leadScore,
    urgency,
    highIntent: lead.highIntent,
  });

  const recommendations: string[] = [];
  if (leadScore >= 75 && lead.highIntent) recommendations.push("Call this lead now.");
  if ((lead.lecipmTrustScore ?? 50) < 55) recommendations.push("Low trust listing - verify first.");
  if ((lead.lecipmDealQualityScore ?? 50) >= 72) recommendations.push("High-value deal - prioritize showing.");
  if (recommendations.length === 0) recommendations.push("Continue with normal follow-up cadence.");

  return {
    leadId: lead.id,
    leadScore,
    predictedCloseLikelihood: closeLikelihood,
    urgency,
    recommendations,
    autoMessages: {
      followUp: `Hi ${lead.name.split(" ")[0] || "there"}, quick follow-up - would you like to review this property's next best action today?`,
      reply: "Thanks for your message. Based on current scores, I can walk you through the safest next step in 2 minutes.",
      summary: `Lead score ${leadScore}/100. Close likelihood ${closeLikelihood}/100. Top action: ${recommendations[0]}`,
    },
  };
}
