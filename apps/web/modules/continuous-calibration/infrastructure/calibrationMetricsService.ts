import type { CalibrationBatchItem } from "@prisma/client";
import {
  computeAgreementDeal,
  computeAgreementRisk,
  computeAgreementTrust,
} from "@/modules/model-validation/infrastructure/agreementService";
import { computeCalibrationMetricsFromRows } from "@/modules/model-validation/infrastructure/calibrationMetricsService";
import type { CalibrationBatchMetricsSnapshot, ListingSegmentJson, SegmentPerformanceRow } from "../domain/calibration.types";
import { segmentKey } from "./batchSamplingService";

export function batchItemsToMetricRows(items: CalibrationBatchItem[]): Parameters<typeof computeCalibrationMetricsFromRows>[0] {
  return items.map((i) => ({
    predictedTrustScore: i.predictedTrustScore,
    predictedTrustConfidence: i.predictedTrustConfidence,
    predictedDealScore: i.predictedDealScore,
    predictedDealConfidence: i.predictedDealConfidence,
    predictedFraudScore: i.predictedFraudScore,
    predictedRecommendation: i.predictedRecommendation,
    humanTrustLabel: i.humanTrustLabel,
    humanDealLabel: i.humanDealLabel,
    humanRiskLabel: i.humanRiskLabel,
    fairnessRating: i.fairnessRating,
    needsManualReview: i.needsManualReview,
  }));
}

export function computeBatchMetricsSnapshot(items: CalibrationBatchItem[]): CalibrationBatchMetricsSnapshot {
  const rows = batchItemsToMetricRows(items);
  const base = computeCalibrationMetricsFromRows(rows);
  const dealLabeled = rows.filter((i) => i.humanDealLabel?.trim());
  const strong = dealLabeled.filter((i) => (i.predictedRecommendation ?? "").trim().toLowerCase() === "strong_opportunity");
  const strongOpportunityShare = dealLabeled.length ? strong.length / dealLabeled.length : null;
  return { ...base, strongOpportunityShare };
}

export function computeSegmentPerformanceBreakdown(items: CalibrationBatchItem[]): SegmentPerformanceRow[] {
  const groups = new Map<string, CalibrationBatchItem[]>();
  for (const it of items) {
    const seg = it.segmentJson as ListingSegmentJson | null | undefined;
    const key = seg ? segmentKey(seg) : "unknown";
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }

  const out: SegmentPerformanceRow[] = [];
  for (const [segmentKey, group] of groups) {
    const trustL = group.filter((i) => i.humanTrustLabel?.trim());
    const dealL = group.filter((i) => i.humanDealLabel?.trim());
    const riskL = group.filter((i) => i.humanRiskLabel?.trim());
    const tAgree = trustL.filter((i) => computeAgreementTrust(i.predictedTrustScore, i.humanTrustLabel) === true).length;
    const dAgree = dealL.filter((i) => computeAgreementDeal(i.predictedRecommendation, i.humanDealLabel) === true).length;
    const rAgree = riskL.filter((i) => computeAgreementRisk(i.predictedFraudScore, i.humanRiskLabel) === true).length;
    const rate = (n: number, d: number) => (d > 0 ? n / d : null);
    out.push({
      segmentKey,
      itemCount: group.length,
      trustAgreementRate: rate(tAgree, trustL.length),
      dealAgreementRate: rate(dAgree, dealL.length),
      riskAgreementRate: rate(rAgree, riskL.length),
    });
  }
  return out.sort((a, b) => a.segmentKey.localeCompare(b.segmentKey));
}

