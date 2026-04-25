/** Critical risk-event count above which executive status is CRITICAL (inspection / board posture). */
export const EXECUTIVE_CRITICAL_HIGH_RISK_THRESHOLD = 5;

export type DashboardMetrics = {
  complaints: number;
  highRiskCases: number;
  trustIssues: number;
  reviewQueue: number;
  legalHolds: number;
};

export function buildDashboardMetrics(input: {
  complaints: number;
  highRisk: number;
  trustIssues: number;
  openReviews: number;
  legalHolds: number;
}): DashboardMetrics {
  return {
    complaints: input.complaints,
    highRiskCases: input.highRisk,
    trustIssues: input.trustIssues,
    reviewQueue: input.openReviews,
    legalHolds: input.legalHolds,
  };
}

export function deriveExecutiveStatus(metrics: DashboardMetrics): "NORMAL" | "ELEVATED" | "CRITICAL" {
  if (metrics.highRiskCases > EXECUTIVE_CRITICAL_HIGH_RISK_THRESHOLD) {
    return "CRITICAL";
  }
  if (metrics.highRiskCases > 0 || metrics.trustIssues > 0) {
    return "ELEVATED";
  }
  return "NORMAL";
}

export function deriveReadinessForInspection(input: {
  executiveStatus: "NORMAL" | "ELEVATED" | "CRITICAL";
  openReviewCount: number;
  unackedAlertCount: number;
  grade: string | null;
}): string {
  if (input.executiveStatus === "CRITICAL") {
    return "Not ready — critical risk concentration; clear executive items before inspection.";
  }
  if (input.unackedAlertCount > 0 || input.openReviewCount > 3) {
    return "At risk — outstanding reviews or alerts need triage.";
  }
  if (input.executiveStatus === "ELEVATED") {
    return "Conditional — elevated signals; document remediation and evidence.";
  }
  if (input.grade && ["D", "F"].includes(input.grade.toUpperCase())) {
    return "Needs work — compliance grade in the lower band; strengthen controls and records.";
  }
  return "Ready — routine diligence; keep audit trail current.";
}
