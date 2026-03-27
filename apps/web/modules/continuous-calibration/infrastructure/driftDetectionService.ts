import type { CalibrationBatchMetricsSnapshot, DriftSummary, DriftThresholds } from "../domain/calibration.types";
import { DEFAULT_DRIFT_THRESHOLDS } from "../domain/calibration.types";
import type { SegmentPerformanceRow } from "../domain/calibration.types";

export type DriftAlertDraft = {
  alertType: string;
  severity: "info" | "warning" | "critical";
  metricName?: string | null;
  previousValue?: number | null;
  currentValue?: number | null;
  thresholdValue?: number | null;
  message: string;
  segmentKey?: string | null;
};

function num(a: number | null | undefined): number | null {
  if (a == null || Number.isNaN(a)) return null;
  return a;
}

/** Deterministic drift rules vs the previous completed batch (if any). */
export function buildDriftAlerts(
  current: CalibrationBatchMetricsSnapshot,
  previous: CalibrationBatchMetricsSnapshot | null,
  segments: SegmentPerformanceRow[],
  thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS,
): DriftAlertDraft[] {
  const alerts: DriftAlertDraft[] = [];
  if (!previous) {
    alerts.push({
      alertType: "baseline",
      severity: "info",
      message: "First batch in sequence — no prior batch metrics to compare for drift.",
    });
    return alerts;
  }

  const pt = num(previous.trustAgreementRate);
  const ct = num(current.trustAgreementRate);
  if (pt != null && ct != null && pt - ct > thresholds.trustAgreementDrop) {
    alerts.push({
      alertType: "trust_agreement_drop",
      severity: "warning",
      metricName: "trustAgreementRate",
      previousValue: pt,
      currentValue: ct,
      thresholdValue: thresholds.trustAgreementDrop,
      message: `Trust agreement dropped by more than ${(thresholds.trustAgreementDrop * 100).toFixed(0)} percentage points vs prior batch.`,
    });
  }

  const pd = num(previous.dealAgreementRate);
  const cd = num(current.dealAgreementRate);
  if (pd != null && cd != null && pd - cd > thresholds.dealAgreementDrop) {
    alerts.push({
      alertType: "deal_agreement_drop",
      severity: "warning",
      metricName: "dealAgreementRate",
      previousValue: pd,
      currentValue: cd,
      thresholdValue: thresholds.dealAgreementDrop,
      message: `Deal agreement dropped by more than ${(thresholds.dealAgreementDrop * 100).toFixed(0)} percentage points vs prior batch.`,
    });
  }

  const pfh = num(previous.falsePositiveHighTrustRate);
  const cfh = num(current.falsePositiveHighTrustRate);
  if (pfh != null && cfh != null && cfh - pfh > thresholds.fpHighTrustRise) {
    alerts.push({
      alertType: "fp_high_trust_rise",
      severity: "warning",
      metricName: "falsePositiveHighTrustRate",
      previousValue: pfh,
      currentValue: cfh,
      thresholdValue: thresholds.fpHighTrustRise,
      message: `High-trust false positive rate increased materially vs prior batch.`,
    });
  }

  const pfs = num(previous.falsePositiveStrongOpportunityRate);
  const cfs = num(current.falsePositiveStrongOpportunityRate);
  if (pfs != null && cfs != null && cfs - pfs > thresholds.fpStrongOpportunityRise) {
    alerts.push({
      alertType: "fp_strong_opportunity_rise",
      severity: "critical",
      metricName: "falsePositiveStrongOpportunityRate",
      previousValue: pfs,
      currentValue: cfs,
      thresholdValue: thresholds.fpStrongOpportunityRise,
      message: `Strong-opportunity false positives rose — critical review recommended.`,
    });
  }

  const plc = num(previous.lowConfidenceDisagreementConcentration);
  const clc = num(current.lowConfidenceDisagreementConcentration);
  if (plc != null && clc != null && plc - clc > thresholds.lowConfidenceConcentrationDrop) {
    alerts.push({
      alertType: "confidence_calibration_slip",
      severity: "warning",
      metricName: "lowConfidenceDisagreementConcentration",
      previousValue: plc,
      currentValue: clc,
      thresholdValue: thresholds.lowConfidenceConcentrationDrop,
      message: `Low-confidence share among disagreements dropped — model may be overconfident when wrong.`,
    });
  }

  const pso = num(previous.strongOpportunityShare);
  const cso = num(current.strongOpportunityShare);
  if (pso != null && cso != null && Math.abs(cso - pso) > thresholds.strongOpportunityShareShift) {
    alerts.push({
      alertType: "recommendation_distribution_shift",
      severity: "info",
      metricName: "strongOpportunityShare",
      previousValue: pso,
      currentValue: cso,
      thresholdValue: thresholds.strongOpportunityShareShift,
      message: `Strong-opportunity recommendation share shifted vs prior batch (stability signal).`,
    });
  }

  const globalTrust = num(current.trustAgreementRate);
  if (globalTrust != null) {
    for (const seg of segments) {
      const st = num(seg.trustAgreementRate);
      if (seg.itemCount < 5 || st == null) continue;
      if (globalTrust - st > thresholds.segmentAgreementGap) {
        alerts.push({
          alertType: "segment_trust_underperformance",
          severity: "warning",
          metricName: "trustAgreementRate",
          previousValue: globalTrust,
          currentValue: st,
          thresholdValue: thresholds.segmentAgreementGap,
          message: `Trust agreement for segment "${seg.segmentKey}" lags global rate by more than ${(thresholds.segmentAgreementGap * 100).toFixed(0)} points (n=${seg.itemCount}).`,
          segmentKey: seg.segmentKey,
        });
      }
    }
  }

  return alerts;
}

export function summarizeDriftAlerts(alerts: DriftAlertDraft[]): DriftSummary {
  return {
    alertCount: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === "critical").length,
    warningCount: alerts.filter((a) => a.severity === "warning").length,
    infoCount: alerts.filter((a) => a.severity === "info").length,
  };
}
