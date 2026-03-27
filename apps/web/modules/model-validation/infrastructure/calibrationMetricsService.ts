import type { ModelValidationItem } from "@prisma/client";
import type { CalibrationMetrics } from "../domain/validation.types";
import { computeAgreementDeal, computeAgreementRisk, computeAgreementTrust, computeAllAgreements } from "./agreementService";
import { normalizeHumanDealLabel, normalizeHumanTrustLabel, trustBucketFromScore } from "./bucketMaps";

/** Minimal row shape for deterministic calibration metrics (validation items, calibration batches, etc.). */
export type CalibrationMetricRow = {
  predictedTrustScore: number | null;
  predictedTrustConfidence: number | null;
  predictedDealScore: number | null;
  predictedDealConfidence: number | null;
  predictedFraudScore: number | null;
  predictedRecommendation: string | null;
  humanTrustLabel: string | null;
  humanDealLabel: string | null;
  humanRiskLabel: string | null;
  fairnessRating: number | null;
  needsManualReview: boolean | null;
};

function isPredictedHighTrust(trustScore: number | null): boolean {
  const b = trustBucketFromScore(trustScore);
  return b === "strong" || b === "verified";
}

function humanTrustIsLow(label: string | null): boolean {
  const h = normalizeHumanTrustLabel(label);
  return h === "critical" || h === "caution";
}

function isPredictedStrongOpportunity(rec: string | null): boolean {
  return (rec ?? "").trim().toLowerCase() === "strong_opportunity";
}

function humanDealIsNegative(label: string | null): boolean {
  const d = normalizeHumanDealLabel(label);
  return d === "negative";
}

export function computeCalibrationMetricsFromRows(items: CalibrationMetricRow[]): CalibrationMetrics {
  const itemCount = items.length;
  if (itemCount === 0) {
    return {
      itemCount: 0,
      fullyLabeledCount: 0,
      totalAgreementRate: null,
      trustAgreementRate: null,
      dealAgreementRate: null,
      riskAgreementRate: null,
      falsePositiveHighTrustRate: null,
      falsePositiveStrongOpportunityRate: null,
      manualReviewRate: null,
      averageFairnessRating: null,
      lowConfidenceDisagreementConcentration: null,
    };
  }

  const trustLabeled = items.filter((i) => i.humanTrustLabel?.trim());
  const dealLabeled = items.filter((i) => i.humanDealLabel?.trim());
  const riskLabeled = items.filter((i) => i.humanRiskLabel?.trim());
  const fullyLabeled = items.filter(
    (i) => i.humanTrustLabel?.trim() && i.humanDealLabel?.trim() && i.humanRiskLabel?.trim(),
  );

  const rate = (num: number, den: number) => (den > 0 ? num / den : null);

  const trustAgree = trustLabeled.filter((i) => computeAgreementTrust(i.predictedTrustScore, i.humanTrustLabel) === true).length;
  const dealAgree = dealLabeled.filter((i) => computeAgreementDeal(i.predictedRecommendation, i.humanDealLabel) === true).length;
  const riskAgree = riskLabeled.filter((i) => computeAgreementRisk(i.predictedFraudScore, i.humanRiskLabel) === true).length;

  const fullAgree = fullyLabeled.filter((i) => {
    const a = computeAllAgreements({
      predictedTrustScore: i.predictedTrustScore,
      predictedRecommendation: i.predictedRecommendation,
      predictedFraudScore: i.predictedFraudScore,
      humanTrustLabel: i.humanTrustLabel,
      humanDealLabel: i.humanDealLabel,
      humanRiskLabel: i.humanRiskLabel,
    });
    return a.agreementTrust === true && a.agreementDeal === true && a.agreementRisk === true;
  }).length;

  const highTrustPred = trustLabeled.filter((i) => isPredictedHighTrust(i.predictedTrustScore));
  const fpHighTrust = highTrustPred.filter((i) => humanTrustIsLow(i.humanTrustLabel)).length;

  const strongOppPred = dealLabeled.filter((i) => isPredictedStrongOpportunity(i.predictedRecommendation));
  const fpStrongOpp = strongOppPred.filter((i) => humanDealIsNegative(i.humanDealLabel)).length;

  const manualNeed = items.filter((i) => i.needsManualReview === true).length;

  const fairnessVals = items.map((i) => i.fairnessRating).filter((n): n is number => n != null && !Number.isNaN(n));
  const avgFair = fairnessVals.length ? fairnessVals.reduce((a, b) => a + b, 0) / fairnessVals.length : null;

  const disagree = items.filter((i) => {
    const a = computeAllAgreements({
      predictedTrustScore: i.predictedTrustScore,
      predictedRecommendation: i.predictedRecommendation,
      predictedFraudScore: i.predictedFraudScore,
      humanTrustLabel: i.humanTrustLabel,
      humanDealLabel: i.humanDealLabel,
      humanRiskLabel: i.humanRiskLabel,
    });
    return a.agreementTrust === false || a.agreementDeal === false || a.agreementRisk === false;
  });
  let lowConfDisagreementConcentration: number | null = null;
  if (disagree.length > 0) {
    const lowConf = disagree.filter((i) => {
      const tc = i.predictedTrustConfidence;
      const dc = i.predictedDealConfidence;
      const lowT = tc != null && tc < 40;
      const lowD = dc != null && dc < 40;
      if (tc == null && dc == null) return false;
      if (tc != null && dc != null) return lowT || lowD;
      return lowT || lowD;
    }).length;
    lowConfDisagreementConcentration = lowConf / disagree.length;
  }

  return {
    itemCount,
    fullyLabeledCount: fullyLabeled.length,
    totalAgreementRate: rate(fullAgree, fullyLabeled.length),
    trustAgreementRate: rate(trustAgree, trustLabeled.length),
    dealAgreementRate: rate(dealAgree, dealLabeled.length),
    riskAgreementRate: rate(riskAgree, riskLabeled.length),
    falsePositiveHighTrustRate: rate(fpHighTrust, highTrustPred.length),
    falsePositiveStrongOpportunityRate: rate(fpStrongOpp, strongOppPred.length),
    manualReviewRate: rate(manualNeed, itemCount),
    averageFairnessRating: avgFair,
    lowConfidenceDisagreementConcentration: lowConfDisagreementConcentration,
  };
}

export function computeCalibrationMetrics(items: ModelValidationItem[]): CalibrationMetrics {
  return computeCalibrationMetricsFromRows(items);
}
