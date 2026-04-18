/**
 * Operator-facing explanations — factual, avoids overstated certainty.
 */

import type {
  OperatorExplanationCard,
  PersistedLandingInsight,
  PersistedRecommendation,
} from "./ads-automation-v4.types";
import type { CampaignClassificationWithEvidence } from "./ads-learning-classifier.service";

export function buildOperatorExplanationCard(rec: PersistedRecommendation): OperatorExplanationCard {
  return {
    title: rec.recommendationType.replace(/_/g, " "),
    summary: rec.reasons.join(" ") || rec.operatorAction,
    reliabilityNote: `Evidence quality: ${rec.evidenceQuality}. Score ${(rec.evidenceScore * 100).toFixed(0)}% on a 0–100 reliability scale (heuristic, not a prediction).`,
    nextSteps: [rec.operatorAction, rec.expectedOutcome ? `Expected: ${rec.expectedOutcome}` : "Review in ad platform UI before changes."].filter(
      Boolean,
    ),
  };
}

export function buildCampaignClassificationExplanation(result: CampaignClassificationWithEvidence): OperatorExplanationCard {
  const m = result.metricsSnapshot;
  return {
    title: `Campaign ${result.campaign.campaignKey}`,
    summary: `${result.classification.toUpperCase()}: ${result.reasons[0] ?? ""}`,
    reliabilityNote: `Evidence ${result.evidenceQuality} (${(result.evidenceScore * 100).toFixed(0)}%). ${result.warnings.join(" ") || "No extra warnings."}`,
    nextSteps: [
      `Impressions ${m.impressions}, clicks ${m.clicks}, CTR ${m.ctrPercent ?? "—"}%.`,
      result.classification === "weak"
        ? "Pause or reduce only after confirming network metrics match this window."
        : "Apply manual changes in Ads Manager; LECIPM does not push budgets.",
    ],
  };
}

export function buildLandingInsightExplanation(insight: PersistedLandingInsight): OperatorExplanationCard {
  return {
    title: insight.issueType.replace(/_/g, " "),
    summary: insight.reasons.join(" ") || insight.operatorAction,
    reliabilityNote: `Confidence ${(insight.confidence * 100).toFixed(0)}%; evidence score ${(insight.evidenceScore * 100).toFixed(0)}%.`,
    nextSteps: [insight.operatorAction, ...insight.recommendedExperiments.slice(0, 3)],
  };
}
