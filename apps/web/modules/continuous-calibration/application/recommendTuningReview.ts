import type { DriftAlertDraft } from "../infrastructure/driftDetectionService";
import type { TuningReviewRecommendation } from "../domain/calibration.types";

/**
 * Heuristic: recommend human-led tuning review when dangerous signals or multiple regressions stack.
 * Does not auto-apply tuning.
 */
export function recommendTuningReview(
  alerts: DriftAlertDraft[],
  options: { repeatedClusterHint?: boolean } = {},
): TuningReviewRecommendation {
  const reasons: string[] = [];
  let score = 0;

  const criticalFp = alerts.some((a) => a.alertType === "fp_strong_opportunity_rise");
  if (criticalFp) {
    reasons.push("Strong-opportunity false positives reached critical drift threshold.");
    score += 3;
  }

  const warnFpHt = alerts.some((a) => a.alertType === "fp_high_trust_rise");
  if (warnFpHt) {
    reasons.push("High-trust false positives increased vs prior batch.");
    score += 2;
  }

  const trustDrop = alerts.some((a) => a.alertType === "trust_agreement_drop");
  const dealDrop = alerts.some((a) => a.alertType === "deal_agreement_drop");
  if (trustDrop && dealDrop) {
    reasons.push("Both trust and deal agreement dropped vs prior batch.");
    score += 2;
  } else if (trustDrop || dealDrop) {
    reasons.push("Core agreement metric regressed vs prior batch.");
    score += 1;
  }

  const confSlip = alerts.some((a) => a.alertType === "confidence_calibration_slip");
  if (confSlip) {
    reasons.push("Confidence calibration may be degrading (low-confidence disagreements no longer concentrated).");
    score += 2;
  }

  const segIssues = alerts.filter((a) => a.alertType === "segment_trust_underperformance");
  if (segIssues.length >= 2) {
    reasons.push("Multiple segments underperform global trust agreement.");
    score += 2;
  } else if (segIssues.length === 1) {
    reasons.push("At least one segment lags global trust agreement.");
    score += 1;
  }

  if (options.repeatedClusterHint) {
    reasons.push("Disagreement clusters appear consistent across recent batches — review simulation.");
    score += 1;
  }

  const tuningReviewRecommended = score >= 3 || criticalFp;

  if (!tuningReviewRecommended && reasons.length === 0) {
    reasons.push("No automatic tuning review triggers fired for this batch.");
  }

  return { tuningReviewRecommended, reasons };
}
