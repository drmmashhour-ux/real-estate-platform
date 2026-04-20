/**
 * Legal Fraud / anomaly engine — operational normalization of intelligence signals only.
 * No accusations; deterministic wording; read-only helpers (no throws).
 */

import type {
  LegalIntelligenceSeverity,
  LegalIntelligenceSignal,
  LegalIntelligenceSignalType,
} from "./legal-intelligence.types";

export type LegalReviewPosture =
  | "standard_review"
  | "priority_review"
  | "manual_verification_recommended"
  | "senior_review_recommended";

export type LegalFraudOperationalIndicator = {
  id: string;
  sourceSignalType: LegalIntelligenceSignalType;
  severity: LegalIntelligenceSeverity;
  label: string;
  explanation: string;
  recommendedReviewPosture: LegalReviewPosture;
};

export type LegalFraudReviewSignal = {
  id: string;
  severity: LegalIntelligenceSeverity;
  headline: string;
  detail: string;
  recommendedReviewPosture: LegalReviewPosture;
};

export type LegalFraudEngineSummary = {
  builtAt: string;
  signalCount: number;
  indicatorCount: number;
  countsBySeverity: Record<LegalIntelligenceSeverity, number>;
  postureDistribution: Partial<Record<LegalReviewPosture, number>>;
  topIndicatorKinds: Array<{ signalType: LegalIntelligenceSignalType; count: number }>;
};

function postureForSignal(t: LegalIntelligenceSignalType, severity: LegalIntelligenceSeverity): LegalReviewPosture {
  const critical = severity === "critical";
  switch (t) {
    case "duplicate_document":
    case "duplicate_identity":
      return critical ? "manual_verification_recommended" : "priority_review";
    case "cross_entity_conflict":
      return critical ? "senior_review_recommended" : "priority_review";
    case "suspicious_resubmission_pattern":
    case "high_risk_submission_burst":
      return critical ? "priority_review" : "manual_verification_recommended";
    case "high_rejection_rate":
    case "missing_required_cluster":
      return critical ? "manual_verification_recommended" : "priority_review";
    case "metadata_anomaly":
    case "mismatched_actor_workflow":
      return critical ? "priority_review" : "manual_verification_recommended";
    case "review_delay_risk":
      return "priority_review";
    case "missing_required_fields":
    case "inconsistent_legal_data":
      return critical ? "manual_verification_recommended" : "priority_review";
    case "incomplete_declaration":
      return "manual_verification_recommended";
    case "conflicting_records":
    case "suspicious_data_pattern":
      return critical ? "priority_review" : "manual_verification_recommended";
    default:
      return "standard_review";
  }
}

function labelForSignal(t: LegalIntelligenceSignalType): string {
  switch (t) {
    case "duplicate_document":
      return "Possible duplicate document pattern";
    case "duplicate_identity":
      return "Possible duplicate identity indicator";
    case "suspicious_resubmission_pattern":
      return "Unusual resubmission timing pattern";
    case "cross_entity_conflict":
      return "Cross-entity metadata overlap";
    case "metadata_anomaly":
      return "Document metadata anomaly";
    case "high_rejection_rate":
      return "Elevated rejection activity";
    case "high_risk_submission_burst":
      return "Burst of submissions requiring review";
    case "review_delay_risk":
      return "Review backlog risk indicator";
    case "missing_required_cluster":
      return "Incomplete required document cluster";
    case "mismatched_actor_workflow":
      return "Workflow actor mismatch indicator";
    case "missing_required_fields":
      return "Structured legal fields appear incomplete";
    case "inconsistent_legal_data":
      return "Structured legal fields show cross-field inconsistencies";
    case "suspicious_data_pattern":
      return "Elevated advisory markers across legal records";
    case "incomplete_declaration":
      return "Declaration completeness gap indicator";
    case "conflicting_records":
      return "Overlapping ownership references differ in structured fields";
    default:
      return "Operational verification indicator";
  }
}

function explanationForSignal(t: LegalIntelligenceSignalType): string {
  switch (t) {
    case "duplicate_document":
      return "Automated checks suggested similarity between submissions — manual verification may be appropriate.";
    case "duplicate_identity":
      return "Signals indicate overlapping identity markers across submissions — verification review is advised.";
    case "suspicious_resubmission_pattern":
      return "Repeated submissions within a short interval were observed — patterns should be reviewed operationally.";
    case "cross_entity_conflict":
      return "Metadata overlaps across entities were detected — an operational conflict review may be warranted.";
    case "metadata_anomaly":
      return "File metadata deviates from expected norms — confirm authenticity and completeness.";
    case "high_rejection_rate":
      return "Rejection volume is elevated relative to peers — assess guidance and submission quality.";
    case "high_risk_submission_burst":
      return "Submission velocity increased sharply — allocate review capacity as needed.";
    case "review_delay_risk":
      return "Items may be aging in queue — monitor throughput and staffing.";
    case "missing_required_cluster":
      return "Required document slots appear incomplete — request remaining materials.";
    case "mismatched_actor_workflow":
      return "Workflow actor does not match expected role assignment — confirm authorization.";
    case "missing_required_fields":
      return "Required structured inputs were not fully present — gather remaining fields through the normal intake flow.";
    case "inconsistent_legal_data":
      return "Structured entries did not align with configured checks — reconciliation review is suggested.";
    case "suspicious_data_pattern":
      return "Several advisory markers appeared together — review workload may need adjustment.";
    case "incomplete_declaration":
      return "Declaration structured answers look incomplete — confirm completion through standard verification.";
    case "conflicting_records":
      return "Structured references across records were not aligned — verification may be appropriate.";
    default:
      return "Operational indicator requires structured review — no automated determination is implied.";
  }
}

/**
 * Maps raw intelligence signals into normalized operational indicators (non-accusatory).
 */
/** When Québec compliance gate fails while anomaly indicators exist, escalate review posture deterministically (no accusations). */
export function escalateIndicatorsForComplianceConflict(
  indicators: LegalFraudOperationalIndicator[],
  opts: { complianceBlocked: boolean; criticalOrWarningSignalsPresent: boolean },
): LegalFraudOperationalIndicator[] {
  try {
    if (!opts.complianceBlocked || !opts.criticalOrWarningSignalsPresent) return indicators;
    const bumpTo: LegalReviewPosture = indicators.some((i) => i.severity === "critical")
      ? "senior_review_recommended"
      : "manual_verification_recommended";
    return indicators.map((i) => ({
      ...i,
      recommendedReviewPosture: bumpTo,
    }));
  } catch {
    return indicators;
  }
}

export function normalizeLegalFraudIndicators(signals: LegalIntelligenceSignal[]): LegalFraudOperationalIndicator[] {
  try {
    const out: LegalFraudOperationalIndicator[] = [];
    for (const s of signals) {
      out.push({
        id: `lfe-ind-${s.id}`,
        sourceSignalType: s.signalType,
        severity: s.severity,
        label: labelForSignal(s.signalType),
        explanation: explanationForSignal(s.signalType),
        recommendedReviewPosture: postureForSignal(s.signalType, s.severity),
      });
    }
    return out.sort((a, b) => {
      const rank = { critical: 3, warning: 2, info: 1 } as const;
      const dr = rank[b.severity] - rank[a.severity];
      if (dr !== 0) return dr;
      return a.id.localeCompare(b.id);
    });
  } catch {
    return [];
  }
}

export function buildLegalFraudReviewSignals(indicators: LegalFraudOperationalIndicator[]): LegalFraudReviewSignal[] {
  try {
    return indicators.slice(0, 12).map((i) => ({
      id: `lfe-rev-${i.id}`,
      severity: i.severity,
      headline: i.label,
      detail: i.explanation,
      recommendedReviewPosture: i.recommendedReviewPosture,
    }));
  } catch {
    return [];
  }
}

export function buildLegalFraudEngineSummary(params: {
  builtAt: string;
  signals: LegalIntelligenceSignal[];
  indicators: LegalFraudOperationalIndicator[];
}): LegalFraudEngineSummary {
  try {
    const countsBySeverity: Record<LegalIntelligenceSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
    };
    const postureDistribution: Partial<Record<LegalReviewPosture, number>> = {};
    const kinds = new Map<LegalIntelligenceSignalType, number>();

    for (const s of params.signals) {
      countsBySeverity[s.severity] += 1;
      kinds.set(s.signalType, (kinds.get(s.signalType) ?? 0) + 1);
    }

    for (const i of params.indicators) {
      postureDistribution[i.recommendedReviewPosture] =
        (postureDistribution[i.recommendedReviewPosture] ?? 0) + 1;
    }

    const topIndicatorKinds = [...kinds.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([signalType, count]) => ({ signalType, count }));

    return {
      builtAt: params.builtAt,
      signalCount: params.signals.length,
      indicatorCount: params.indicators.length,
      countsBySeverity,
      postureDistribution,
      topIndicatorKinds,
    };
  } catch {
    return {
      builtAt: params.builtAt,
      signalCount: 0,
      indicatorCount: 0,
      countsBySeverity: { info: 0, warning: 0, critical: 0 },
      postureDistribution: {},
      topIndicatorKinds: [],
    };
  }
}
