import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";
import type { PredictionResult } from "./conversion.predictor";

export async function predictSeoTraffic(pageSlug: string): Promise<PredictionResult> {
  if (!growthV3Flags.predictiveModelsV1) {
    return { score: 50, confidence: 0, explanation: ["predictive models off"] };
  }
  const row = await prisma.seoPageOpportunity.findUnique({ where: { slug: pageSlug } });
  if (!row) return { score: 0, confidence: 0.8, explanation: ["Unknown SEO page slug"] };
  const score = Math.min(100, Math.round(row.opportunityScore));
  return {
    score,
    confidence: 0.5,
    explanation: [
      `Based on stored opportunityScore ${row.opportunityScore} and inventoryCount ${row.inventoryCount} — not a traffic guarantee.`,
    ],
  };
}
