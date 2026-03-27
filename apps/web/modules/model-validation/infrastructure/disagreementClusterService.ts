import type { ModelValidationItem } from "@prisma/client";
import {
  dealBucketFromRecommendation,
  fraudBucketFromScore,
  normalizeHumanDealLabel,
  normalizeHumanTrustLabel,
  trustBucketFromScore,
} from "./bucketMaps";

export type DisagreementClusterId =
  | "false_positive_high_trust"
  | "false_positive_strong_opportunity"
  | "false_negative_high_trust"
  | "false_negative_strong_opportunity"
  | "low_confidence_disagreement"
  | "suspicious_missed_cases";

export type ClusterAnalysis = {
  cluster: DisagreementClusterId;
  count: number;
  itemIds: string[];
};

function isLowConfidenceTrust(c: number | null): boolean {
  return c != null && c < 40;
}
function isLowConfidenceDeal(c: number | null): boolean {
  return c != null && c < 40;
}

export function clusterForItem(item: ModelValidationItem): DisagreementClusterId | null {
  const predTrust = trustBucketFromScore(item.predictedTrustScore);
  const humTrust = normalizeHumanTrustLabel(item.humanTrustLabel);
  const predDeal = dealBucketFromRecommendation(item.predictedRecommendation);
  const humDeal = normalizeHumanDealLabel(item.humanDealLabel);
  const predFraud = fraudBucketFromScore(item.predictedFraudScore);
  const humRisk = item.humanRiskLabel?.trim().toLowerCase();

  const trustDisagree = item.agreementTrust === false;
  const dealDisagree = item.agreementDeal === false;
  const riskDisagree = item.agreementRisk === false;

  const lowConf =
    isLowConfidenceTrust(item.predictedTrustConfidence) ||
    isLowConfidenceDeal(item.predictedDealConfidence);

  if (
    dealDisagree &&
    item.predictedRecommendation?.toLowerCase().includes("strong_opportunity") &&
    humDeal === "negative"
  ) {
    return "false_positive_strong_opportunity";
  }

  if (trustDisagree && predTrust && humTrust) {
    const predHigh = predTrust === "strong" || predTrust === "verified";
    const humLow = humTrust === "critical" || humTrust === "caution";
    if (predHigh && humLow) return "false_positive_high_trust";
  }

  if (dealDisagree && humDeal === "strong" && predDeal === "negative") {
    return "false_negative_strong_opportunity";
  }

  if (trustDisagree && predTrust && humTrust) {
    const humHigh = humTrust === "strong" || humTrust === "verified";
    const predLow = predTrust === "critical" || predTrust === "caution";
    if (humHigh && predLow) return "false_negative_high_trust";
  }

  if (lowConf && (trustDisagree || dealDisagree || riskDisagree)) {
    return "low_confidence_disagreement";
  }

  if (predFraud === "low" && humRisk && (humRisk === "high" || humRisk === "medium")) {
    return "suspicious_missed_cases";
  }

  return null;
}

export function analyzeClusters(items: ModelValidationItem[]): ClusterAnalysis[] {
  const buckets: Record<DisagreementClusterId, string[]> = {
    false_positive_high_trust: [],
    false_positive_strong_opportunity: [],
    false_negative_high_trust: [],
    false_negative_strong_opportunity: [],
    low_confidence_disagreement: [],
    suspicious_missed_cases: [],
  };

  for (const it of items) {
    const c = clusterForItem(it);
    if (c) buckets[c].push(it.id);
  }

  return (Object.keys(buckets) as DisagreementClusterId[]).map((cluster) => ({
    cluster,
    count: buckets[cluster].length,
    itemIds: buckets[cluster],
  }));
}
