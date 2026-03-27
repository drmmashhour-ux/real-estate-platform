import {
  dealBucketFromRecommendation,
  fraudBucketFromScore,
  normalizeHumanDealLabel,
  normalizeHumanRiskLabel,
  normalizeHumanTrustLabel,
  trustBucketFromScore,
} from "./bucketMaps";

/**
 * Deterministic agreement: predicted buckets vs normalized human labels.
 * Returns null if human label missing for that dimension.
 */
export function computeAgreementTrust(predictedTrustScore: number | null, humanTrustLabel: string | null): boolean | null {
  if (humanTrustLabel == null || humanTrustLabel.trim() === "") return null;
  const pb = trustBucketFromScore(predictedTrustScore);
  const hb = normalizeHumanTrustLabel(humanTrustLabel);
  if (!hb || !pb) return null;
  return pb === hb;
}

export function computeAgreementDeal(predictedRecommendation: string | null, humanDealLabel: string | null): boolean | null {
  if (humanDealLabel == null || humanDealLabel.trim() === "") return null;
  const pb = dealBucketFromRecommendation(predictedRecommendation);
  const hb = normalizeHumanDealLabel(humanDealLabel);
  if (!hb || !pb) return null;
  return pb === hb;
}

export function computeAgreementRisk(predictedFraudScore: number | null, humanRiskLabel: string | null): boolean | null {
  if (humanRiskLabel == null || humanRiskLabel.trim() === "") return null;
  const pb = fraudBucketFromScore(predictedFraudScore);
  const hb = normalizeHumanRiskLabel(humanRiskLabel);
  if (!hb || !pb) return null;
  return pb === hb;
}

export function computeAllAgreements(args: {
  predictedTrustScore: number | null;
  predictedRecommendation: string | null;
  predictedFraudScore: number | null;
  humanTrustLabel: string | null;
  humanDealLabel: string | null;
  humanRiskLabel: string | null;
}): {
  agreementTrust: boolean | null;
  agreementDeal: boolean | null;
  agreementRisk: boolean | null;
} {
  return {
    agreementTrust: computeAgreementTrust(args.predictedTrustScore, args.humanTrustLabel),
    agreementDeal: computeAgreementDeal(args.predictedRecommendation, args.humanDealLabel),
    agreementRisk: computeAgreementRisk(args.predictedFraudScore, args.humanRiskLabel),
  };
}
