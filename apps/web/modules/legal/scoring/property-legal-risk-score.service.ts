/**
 * Property legal / platform risk index — explanatory only; not legal advice.
 */

import type {
  PropertyLegalRiskFactor,
  PropertyLegalRiskLevel,
  PropertyLegalRiskScore,
} from "./property-legal-risk.types";
import type { QuebecListingComplianceEvaluationResult } from "../compliance/quebec-listing-compliance-evaluator.service";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function levelFromScore(score: number): PropertyLegalRiskLevel {
  if (score <= 19) return "low";
  if (score <= 39) return "guarded";
  if (score <= 59) return "elevated";
  if (score <= 79) return "high";
  return "critical";
}

export type ComputePropertyLegalRiskScoreParams = {
  listingId: string;
  complianceEvaluation: QuebecListingComplianceEvaluationResult;
  manualReviewCompleted?: boolean;
  identityVerifiedStrong?: boolean;
  ownershipRecordValidated?: boolean;
  rejectionCycles?: number;
  /** Deterministic certificate-of-location helper signals (structured metadata only). */
  certificateSignals?: {
    readinessPenalty01: number;
    mismatchCount: number;
    timelineFlagged?: boolean;
  };
};

function mkFactor(
  p: Partial<PropertyLegalRiskFactor> &
    Pick<PropertyLegalRiskFactor, "id" | "type" | "severity" | "weight" | "label" | "explanation">,
): PropertyLegalRiskFactor {
  return { sourceRefs: [], ...p };
}

export function computePropertyLegalRiskScore(params: ComputePropertyLegalRiskScoreParams): PropertyLegalRiskScore {
  try {
    const listingId = params.listingId || "unknown";
    const factors: PropertyLegalRiskFactor[] = [];
    let score = 10;

    const ce = params.complianceEvaluation;
    const fraudCrit = Number(ce.evidenceSummary.fraudCriticalCount ?? 0);
    const ruleCrit = Number(ce.evidenceSummary.ruleCriticalCount ?? 0);
    const intelCrit = Number(ce.evidenceSummary.legalIntelCriticalCount ?? 0);

    const blockingHits = ce.blockingIssues.filter((id) => id !== "qc_evaluator_fallback");
    if (blockingHits.length > 0) {
      const bump = Math.min(48, 18 + blockingHits.length * 8);
      score += bump;
      factors.push(
        mkFactor({
          id: "plr_checklist_blocking",
          type: "missing_required_record",
          severity: "critical",
          weight: bump,
          label: "Checklist blocking gaps",
          explanation:
            blockingHits.length === 1
              ? "One checklist item blocks publish until completed."
              : `${blockingHits.length} checklist gaps block publish until resolved.`,
          sourceRefs: blockingHits.slice(0, 14),
        }),
      );
    }

    const readinessGap = 100 - ce.readinessScore;
    if (readinessGap > 0) {
      const w = Math.min(22, Math.round(readinessGap * 0.22));
      score += w;
      factors.push(
        mkFactor({
          id: "plr_readiness_gap",
          type: "declaration_incomplete",
          severity: readinessGap > 40 ? "critical" : "warning",
          weight: w,
          label: "Publish readiness gap",
          explanation: `Readiness index reflects incomplete platform requirements (${ce.readinessScore}/100).`,
        }),
      );
    }

    if (fraudCrit > 0) {
      const w = Math.min(30, 10 + fraudCrit * 9);
      score += w;
      factors.push(
        mkFactor({
          id: "plr_fraud_critical_markers",
          type: "fraud_indicator",
          severity: "critical",
          weight: w,
          label: "Operational fraud markers",
          explanation: "Critical operational fraud indicators require review.",
        }),
      );
    }

    if (ruleCrit > 0) {
      const w = Math.min(24, 8 + ruleCrit * 7);
      score += w;
      factors.push(
        mkFactor({
          id: "plr_rule_critical_hits",
          type: "critical_rule_hit",
          severity: "critical",
          weight: w,
          label: "Critical legal rule hits",
          explanation: "Structured rule engine reported critical hits for this listing.",
        }),
      );
    }

    if (intelCrit > 0) {
      const w = Math.min(26, 8 + intelCrit * 6);
      score += w;
      factors.push(
        mkFactor({
          id: "plr_intel_critical",
          type: "failed_validation",
          severity: intelCrit > 2 ? "critical" : "warning",
          weight: w,
          label: "Compliance intelligence signals",
          explanation: "Compliance intelligence flagged critical findings in scope.",
        }),
      );
    }

    for (const r of ce.legacyChecklist.results) {
      if (r.passed) continue;
      if (r.itemId === "qc_general_no_unresolved_rejection_loops") {
        const w = 14;
        score += w;
        factors.push(
          mkFactor({
            id: "plr_rejection_instability",
            type: "rejection_loop",
            severity: "warning",
            weight: w,
            label: "Document review instability",
            explanation: "Repeated review outcomes indicate instability — resolve uploads before publishing.",
            sourceRefs: ["qc_general_no_unresolved_rejection_loops"],
          }),
        );
      }
    }

    const cycles =
      typeof params.rejectionCycles === "number" && Number.isFinite(params.rejectionCycles)
        ? Math.max(0, params.rejectionCycles)
        : 0;
    if (cycles >= 2) {
      const w = Math.min(18, 8 + cycles * 3);
      score += w;
      factors.push(
        mkFactor({
          id: "plr_resubmission_cycles",
          type: "rejection_loop",
          severity: "warning",
          weight: w,
          label: "Resubmission cycles",
          explanation: "Multiple review cycles elevate platform-assessed friction risk.",
        }),
      );
    }

    const cs = params.certificateSignals;
    if (cs && (cs.readinessPenalty01 > 0 || cs.mismatchCount > 0 || cs.timelineFlagged)) {
      const pen = Math.min(
        20,
        Math.round(Math.min(1, Math.max(0, cs.readinessPenalty01)) * 12) +
          Math.min(8, cs.mismatchCount * 4) +
          (cs.timelineFlagged ? 4 : 0),
      );
      if (pen > 0) {
        score += pen;
        factors.push(
          mkFactor({
            id: "plr_certificate_location_signals",
            type: "declaration_incomplete",
            severity: cs.mismatchCount > 0 ? "warning" : "info",
            weight: pen,
            label: "Certificate-of-location workflow signals",
            explanation:
              "Structured certificate helper reported readiness gaps or cross-field differences — informational index only.",
          }),
        );
      }
    }

    if (params.manualReviewCompleted === true) {
      score -= 8;
      factors.push(
        mkFactor({
          id: "plr_manual_review_completed",
          type: "manual_review_required",
          severity: "info",
          weight: -8,
          label: "Manual review recorded",
          explanation: "Completed manual review modestly reduces residual risk index.",
        }),
      );
    }

    if (params.identityVerifiedStrong === true) {
      score -= 6;
      factors.push(
        mkFactor({
          id: "plr_identity_verified",
          type: "identity_unverified",
          severity: "info",
          weight: -6,
          label: "Identity pathway strong",
          explanation: "Strong identity verification reduces residual identity uncertainty.",
        }),
      );
    }

    if (params.ownershipRecordValidated === true) {
      score -= 6;
      factors.push(
        mkFactor({
          id: "plr_ownership_verified",
          type: "ownership_unverified",
          severity: "info",
          weight: -6,
          label: "Ownership pathway validated",
          explanation: "Validated ownership documentation reduces residual ownership uncertainty.",
        }),
      );
    }

    score = clamp(score);
    const level = levelFromScore(score);
    const blocking =
      blockingHits.length > 0 || level === "critical" || score >= 80 || ce.legacyChecklist.blockingIssues.includes("qc_evaluator_fallback");

    const summary =
      blocking
        ? "Elevated platform-assessed legal/compliance risk — publishing blocked or requires review."
        : score >= 60
          ? "Material compliance friction remains — review recommended."
          : "Residual compliance risk within guarded bounds for platform automation.";

    return {
      listingId,
      score,
      level,
      factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
      blocking,
      summary,
    };
  } catch {
    return {
      listingId: params.listingId ?? "unknown",
      score: 55,
      level: "elevated",
      factors: [
        mkFactor({
          id: "plr_fallback",
          type: "manual_review_required",
          severity: "warning",
          weight: 0,
          label: "Risk evaluation fallback",
          explanation: "Risk evaluation used a safe deterministic fallback — verification may be required.",
        }),
      ],
      blocking: true,
      summary: "Risk evaluation requires verification — publishing should remain paused.",
    };
  }
}
