import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";
import type { PredictionResult } from "./conversion.predictor";

export async function predictEngagementForUser(userId: string): Promise<PredictionResult> {
  if (!growthV3Flags.predictiveModelsV1) {
    return { score: 50, confidence: 0, explanation: ["predictive models off"] };
  }
  const [saves, views] = await Promise.all([
    prisma.buyerSavedListing.count({ where: { userId } }),
    prisma.buyerListingView.count({ where: { userId } }),
  ]);
  const score = Math.min(100, Math.round(30 + Math.log1p(saves) * 15 + Math.log1p(views) * 8));
  return {
    score,
    confidence: 0.45,
    explanation: [`Saved listings: ${saves}, listing views: ${views} (real counts).`],
  };
}
