/**
 * FSBO pre-publish gate — deterministic compliance + legal risk; no writes in this module.
 */

import type { QuebecComplianceEvaluatorInput } from "./quebec-compliance-evaluator.service";
import {
  evaluateQuebecListingCompliance,
  type QuebecListingComplianceEvaluationResult,
} from "./quebec-listing-compliance-evaluator.service";
import {
  computePropertyLegalRiskScore,
  type ComputePropertyLegalRiskScoreParams,
} from "../scoring/property-legal-risk-score.service";
import type { PropertyLegalRiskScore } from "../scoring/property-legal-risk.types";
import { complianceFlags } from "@/config/feature-flags";

export const QUEBEC_HARD_BLOCK_LEGAL_RISK = 80;
export const QUEBEC_SOFT_READINESS_WARN = 72;
export const QUEBEC_REVIEW_LEGAL_RISK = 68;

export type PrepublishBlockEvaluation = {
  allowed: boolean;
  readinessScore: number;
  legalRiskScore: number;
  blockingIssues: string[];
  warnings: string[];
  userSafeReasons: string[];
  adminReasons: string[];
  reviewRequired: boolean;
  complianceEvaluation: QuebecListingComplianceEvaluationResult | null;
  legalRisk: PropertyLegalRiskScore | null;
};

function mapUserSafeReason(id: string): string {
  const map: Record<string, string> = {
    ql_core_listing_status_allows_publish: "Complete required information before publishing — listing status must allow going live.",
    qc_listing_ownership_proof_present: "Ownership documentation is missing or needs verification.",
    qc_listing_seller_declaration_complete: "Complete the required seller declaration before publishing.",
    qc_listing_property_basic_data_present: "Price, property type, and a valid address are required.",
    qc_listing_no_internal_conflicts_in_declaration: "Declaration fields appear inconsistent — please review and correct.",
    qc_listing_required_disclosures_present: "Acknowledgements may be required — complete prompts shown in your seller hub.",
    qc_broker_license_reference_present: "Broker licence verification is required for this listing type.",
    qc_broker_brokerage_identification_present: "Brokerage identification should be completed where applicable.",
    qc_landlord_lease_terms_present: "Rental or lease terms must be provided for this listing mode.",
    qc_landlord_rental_conditions_defined: "Rental operating conditions should be described.",
    qc_str_registration_number_present: "Short-term registration information is missing or incomplete.",
    qc_str_local_authorization_present: "Local authorization details are missing or incomplete.",
    qc_str_capacity_limits_defined: "Occupancy limits should be defined.",
    qc_general_identity_document_verified: "Additional identity verification is required.",
    qc_general_no_high_risk_legal_indicators: "Additional verification is required before publishing.",
    qc_general_no_unresolved_rejection_loops: "Please resolve outstanding document review items.",
  };
  return map[id] ?? "Please resolve the following items before publishing.";
}

function deriveUserReasons(blockingIds: string[]): string[] {
  const out: string[] = [];
  for (const id of blockingIds) {
    if (id === "qc_evaluator_fallback" || id === "qc_gate_fallback" || id === "qc_load_failed") continue;
    out.push(mapUserSafeReason(id));
  }
  return [...new Set(out)];
}

function deriveAdminReasons(blockingIds: string[], legalRisk: PropertyLegalRiskScore | null): string[] {
  const a: string[] = [];
  for (const id of blockingIds) {
    if (id === "qc_evaluator_fallback") {
      a.push("Critical compliance failure — evaluator fallback triggered.");
      continue;
    }
    a.push(`Blocked by Québec compliance policy — item ${id}`);
  }
  if (legalRisk && (legalRisk.level === "critical" || legalRisk.score >= QUEBEC_HARD_BLOCK_LEGAL_RISK)) {
    a.push("Elevated legal risk index — publish blocked by platform policy.");
  }
  return a;
}

export type PrepublishEvaluateParams = {
  listingId: string;
  evaluatorInput: QuebecComplianceEvaluatorInput | null;
  manualReviewCompleted?: boolean;
};

/**
 * Evaluate auto-block rule for FSBO publish (pure; caller loads `evaluatorInput`).
 */
export function evaluateListingPrepublishBlock(params: PrepublishEvaluateParams): PrepublishBlockEvaluation {
  try {
    if (!params.evaluatorInput) {
      return {
        allowed: false,
        readinessScore: 0,
        legalRiskScore: 100,
        blockingIssues: ["qc_load_failed"],
        warnings: [],
        userSafeReasons: ["Additional verification is required before publishing."],
        adminReasons: ["Listing context could not be loaded for compliance evaluation."],
        reviewRequired: true,
        complianceEvaluation: null,
        legalRisk: null,
      };
    }

    const ce = evaluateQuebecListingCompliance({ evaluatorInput: params.evaluatorInput });

    const identityStrong =
      params.evaluatorInput.listing.verificationIdentityStage === "VERIFIED" ||
      params.evaluatorInput.listing.verificationIdentityStage === "APPROVED";
    const ownershipValidated = (params.evaluatorInput.legalRecords ?? []).some(
      (r) => r.recordType === "proof_of_ownership" && r.status === "validated",
    );

    const riskParams: ComputePropertyLegalRiskScoreParams = {
      listingId: params.listingId,
      complianceEvaluation: ce,
      manualReviewCompleted: params.manualReviewCompleted === true,
      identityVerifiedStrong: identityStrong,
      ownershipRecordValidated: ownershipValidated,
      rejectionCycles: params.evaluatorInput.documentRejectionLoop ? 3 : 0,
    };

    const legalRisk =
      complianceFlags.propertyLegalRiskScoreV1 === true ? computePropertyLegalRiskScore(riskParams) : null;

    const legalRiskScore = legalRisk?.score ?? Math.max(0, 100 - ce.readinessScore);

    const evalFallback = ce.legacyChecklist.blockingIssues.includes("qc_evaluator_fallback");
    const blockChecklist = !ce.requiredChecklistPassed || evalFallback;

    const blockRisk =
      complianceFlags.propertyLegalRiskScoreV1 === true &&
      legalRisk != null &&
      (legalRisk.blocking === true || legalRisk.score >= QUEBEC_HARD_BLOCK_LEGAL_RISK);

    const finalAllowed = !blockChecklist && !blockRisk;

    const fraudCrit = Number(ce.evidenceSummary.fraudCriticalCount ?? 0);

    const reviewRequired =
      !finalAllowed ||
      (legalRisk != null && legalRisk.score >= QUEBEC_REVIEW_LEGAL_RISK) ||
      ce.readinessScore < QUEBEC_SOFT_READINESS_WARN ||
      fraudCrit > 0;

    let userSafeReasons = finalAllowed ? [] : deriveUserReasons(ce.blockingIssues);
    if (!finalAllowed && userSafeReasons.length === 0) {
      userSafeReasons = ["Complete required information before publishing."];
    }

    const adminReasons = finalAllowed ? [] : deriveAdminReasons(ce.blockingIssues, legalRisk);

    return {
      allowed: finalAllowed,
      readinessScore: ce.readinessScore,
      legalRiskScore,
      blockingIssues: [...ce.blockingIssues],
      warnings: ce.warnings,
      userSafeReasons,
      adminReasons,
      reviewRequired,
      complianceEvaluation: ce,
      legalRisk,
    };
  } catch {
    return {
      allowed: false,
      readinessScore: 0,
      legalRiskScore: 100,
      blockingIssues: ["qc_gate_fallback"],
      warnings: [],
      userSafeReasons: ["Additional verification is required before publishing."],
      adminReasons: ["Compliance evaluation failed safe fallback."],
      reviewRequired: true,
      complianceEvaluation: null,
      legalRisk: null,
    };
  }
}

export function buildPrepublishBlockResponse(evalResult: PrepublishBlockEvaluation): {
  error: "COMPLIANCE_BLOCK";
  reasons: string[];
  blockingIssues: string[];
  readinessScore: number;
  legalRiskScore: number;
  reviewRequired: boolean;
  adminReasons?: string[];
} {
  return {
    error: "COMPLIANCE_BLOCK",
    reasons: evalResult.userSafeReasons,
    blockingIssues: evalResult.blockingIssues,
    readinessScore: evalResult.readinessScore,
    legalRiskScore: evalResult.legalRiskScore,
    reviewRequired: evalResult.reviewRequired,
    adminReasons: evalResult.adminReasons,
  };
}
