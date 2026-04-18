import { growthV3Flags } from "@/config/feature-flags";
import type { GrowthBrainLearnInput, GrowthBrainPredictInput, GrowthOpportunityInput } from "./growth-brain.types";
import { applyLearningFromOutcome } from "./growth-brain.learning";
import { predictConversion } from "@/src/modules/predictions/conversion.predictor";
import { predictEngagementForUser } from "@/src/modules/predictions/engagement.predictor";
import { decideOnOpportunity } from "./growth-brain.decision";

/**
 * Central façade for Growth Brain v3 — all paths flag-gated.
 */
export const growthBrain = {
  async learn(input: GrowthBrainLearnInput): Promise<{ ok: boolean }> {
    if (!growthV3Flags.growthBrainV1) return { ok: false };
    await applyLearningFromOutcome(input);
    return { ok: true };
  },

  async predict(input: GrowthBrainPredictInput) {
    if (!growthV3Flags.growthBrainV1) {
      return {
        conversionScore: 0,
        engagementScore: 0,
        confidence: 0,
        explanation: ["FEATURE_GROWTH_BRAIN_V1 disabled"],
      };
    }
    const listingId = input.listingId ?? "";
    const conv = listingId
      ? await predictConversion(listingId, input.userId)
      : { score: 50, confidence: 0.2, explanation: ["No listing id — neutral"] };
    const eng = input.userId
      ? await predictEngagementForUser(input.userId)
      : { score: 40, confidence: 0.2, explanation: ["No user id"] };
    return {
      conversionScore: conv.score,
      engagementScore: eng.score,
      confidence: (conv.confidence + eng.confidence) / 2,
      explanation: [...conv.explanation, ...eng.explanation],
    };
  },

  decide: decideOnOpportunity,

  async decideOpportunity(op: GrowthOpportunityInput) {
    return decideOnOpportunity(op);
  },
};
