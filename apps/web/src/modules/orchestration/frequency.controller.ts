import { growthV3Flags } from "@/config/feature-flags";

export type FrequencyPlan = {
  maxEmailsPerWeek: number;
  maxPushPerWeek: number;
  explanation: string[];
};

const SAFE_DEFAULT: FrequencyPlan = {
  maxEmailsPerWeek: 2,
  maxPushPerWeek: 3,
  explanation: ["Default anti-spam caps."],
};

/**
 * Conservative caps — actual sends must still pass campaign + consent layers.
 */
export function computeFrequencyCaps(stage: string): FrequencyPlan {
  if (!growthV3Flags.orchestrationEngineV1) {
    return { ...SAFE_DEFAULT, explanation: [...SAFE_DEFAULT.explanation, "Orchestration flag off — minimal caps."] };
  }
  if (stage === "high_intent" || stage === "converting") {
    return {
      maxEmailsPerWeek: 4,
      maxPushPerWeek: 5,
      explanation: ["Slightly higher caps for high-intent — still bounded."],
    };
  }
  if (stage === "dormant" || stage === "churn_risk") {
    return {
      maxEmailsPerWeek: 1,
      maxPushPerWeek: 1,
      explanation: ["Reduced caps for win-back to limit fatigue."],
    };
  }
  return SAFE_DEFAULT;
}
