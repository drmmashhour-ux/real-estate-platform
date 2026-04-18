import { growthV3Flags } from "@/config/feature-flags";
import type { PredictionResult } from "./conversion.predictor";

export async function predictReferralLikelihood(userId: string): Promise<PredictionResult> {
  if (!growthV3Flags.predictiveModelsV1) {
    return { score: 40, confidence: 0, explanation: ["predictive models off"] };
  }
  void userId;
  return {
    score: 45,
    confidence: 0.25,
    explanation: [
      "Placeholder virality score — wire referral events + satisfaction signals for v4 ML.",
    ],
  };
}
