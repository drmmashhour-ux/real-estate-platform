import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";
import type { PredictionResult } from "./conversion.predictor";

export async function predictChurnRisk(userId: string): Promise<PredictionResult> {
  if (!growthV3Flags.predictiveModelsV1) {
    return { score: 20, confidence: 0, explanation: ["predictive models off"] };
  }
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { updatedAt: true, createdAt: true },
  });
  if (!u) return { score: 100, confidence: 0.9, explanation: ["User missing"] };
  const daysSinceActive = (Date.now() - u.updatedAt.getTime()) / 86400000;
  const score = Math.min(100, Math.round(Math.log1p(daysSinceActive) * 22));
  return {
    score,
    confidence: 0.4,
    explanation: [`Days since last profile activity (proxy): ${daysSinceActive.toFixed(1)}`],
  };
}
