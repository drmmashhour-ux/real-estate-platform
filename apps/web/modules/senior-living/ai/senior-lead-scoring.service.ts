/**
 * AI-layer lead scoring row in `SeniorLeadScore` — explainable blend on top of feature extractor.
 */
import { prisma } from "@/lib/db";
import { logSeniorAi } from "@/lib/senior-ai/log";
import type { LeadFeatureHints } from "../lead-features.service";
import { extractSeniorLeadFeatures } from "../lead-features.service";
import {
  bandFromScore,
  buildExplanation,
  computeLeadScoreNumber,
  getOrCreateScoringWeights,
} from "../lead-scoring.service";

/** Part 9 blend + persistence to AI table (canonical lead scores may exist separately). */
export async function scoreLeadWithAiLayer(
  leadId: string,
  hints?: LeadFeatureHints,
): Promise<{ score: number; band: string; bullets: string[] }> {
  const features = await extractSeniorLeadFeatures(leadId, hints);
  const wRow = await getOrCreateScoringWeights();
  const sum =
    wRow.wEngagement + wRow.wBudget + wRow.wCare + wRow.wIntent + wRow.wSource || 1;
  const baseScore = computeLeadScoreNumber(features, {
    wEngagement: wRow.wEngagement / sum,
    wBudget: wRow.wBudget / sum,
    wCare: wRow.wCare / sum,
    wIntent: wRow.wIntent / sum,
    wSource: wRow.wSource / sum,
  });

  const engagement = Math.min(100, features.engagementScore);
  const careClarity = features.careMatch;
  const budgetClarity = features.budgetMatch;
  const bestMatchInteraction = features.clickedBestMatch ? 92 : 48;
  const repeatIntent = Math.min(100, features.pagesViewed * 22);
  const urgencyIndicators = features.voiceUsed ? 78 : 52;

  const blended =
    0.22 * engagement +
    0.22 * careClarity +
    0.18 * budgetClarity +
    0.18 * bestMatchInteraction +
    0.1 * repeatIntent +
    0.1 * urgencyIndicators;

  const score = Math.round(0.5 * baseScore + 0.5 * blended);
  const band = bandFromScore(score);
  const bullets = buildExplanation(features).slice(0, 4);

  await prisma.seniorLeadScore.create({
    data: {
      leadId,
      score,
      probability: Math.min(1, score / 100),
      band,
      explanationJson: { bullets, baseScore, blendedLayer: blended },
    },
  });

  logSeniorAi("[senior-lead-score]", "scored", { leadId, band });
  return { score, band, bullets };
}
