import type { ConversionPrediction } from "./senior-ai.types";

/** Proxy probabilities from lead score until calibrated outcomes exist. */
export function predictConversionFromLeadFeatures(args: {
  leadScore: number;
  engagementHint?: number;
}): ConversionPrediction {
  const s = Math.max(0, Math.min(100, args.leadScore));
  const visitProbability = Math.round(s * 0.92) / 100;
  const contractProbability = Math.round(s * 0.55) / 100;
  const priorityLabel = s >= 75 ? "HIGH" : s >= 40 ? "MEDIUM" : "LOW";
  let nextBestAction = "Send a gentle follow-up with one clear next step";
  if (priorityLabel === "HIGH") nextBestAction = "Recommend visit follow-up now";
  else if (priorityLabel === "LOW") nextBestAction = "Send one more matching option before pausing";

  return {
    visitProbability,
    contractProbability,
    priorityLabel,
    nextBestAction,
  };
}
