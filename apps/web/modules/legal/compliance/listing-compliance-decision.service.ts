/**
 * Build user-safe publish decision from a completed evaluation (no I/O).
 */

import { evaluateQuebecCompliance, type QuebecComplianceEvaluatorInput } from "./quebec-compliance-evaluator.service";
import type { ListingComplianceDecision, QuebecComplianceChecklistResult } from "./quebec-compliance.types";

const REASON_MAP: Record<string, string> = {
  qc_listing_ownership_proof_present: "Ownership documentation is missing or needs verification.",
  qc_listing_seller_declaration_complete: "Complete the required seller declaration before publishing.",
  qc_listing_property_basic_data_present: "Price, property type, and a valid address are required.",
  qc_listing_no_internal_conflicts_in_declaration: "Declaration fields are inconsistent — review and correct.",
  qc_listing_required_disclosures_present: "Required acknowledgements are not yet recorded.",
  qc_broker_license_reference_present: "Broker licence verification is required for this listing type.",
  qc_broker_brokerage_identification_present: "Brokerage identification should be associated with the listing.",
  qc_landlord_lease_terms_present: "Rental or lease terms must be provided for this listing mode.",
  qc_landlord_rental_conditions_defined: "Rental operating conditions should be described.",
  qc_str_registration_number_present: "Short-term registration information is missing or incomplete.",
  qc_str_local_authorization_present: "Local authorization details are missing or incomplete.",
  qc_str_capacity_limits_defined: "Occupancy limits should be defined.",
  qc_general_identity_document_verified: "Identity verification must be completed before publishing.",
  qc_general_no_high_risk_legal_indicators: "Operational compliance markers require review — publishing is paused.",
  qc_general_no_unresolved_rejection_loops: "Outstanding document review issues must be resolved.",
};

function humanReason(itemId: string, checklist: QuebecComplianceChecklistResult): string {
  const preset = REASON_MAP[itemId];
  if (preset) return preset;
  const hit = checklist.results.find((r) => r.itemId === itemId);
  return hit?.message ?? `Verification required for checklist item (${itemId}).`;
}

function listingComplianceDecisionFromChecklist(
  listingId: string,
  checklist: QuebecComplianceChecklistResult,
): ListingComplianceDecision {
  const blockingIssues = checklist.blockingIssues.filter((id) => id !== "qc_evaluator_fallback");
  const allowed = blockingIssues.length === 0 && !checklist.blockingIssues.includes("qc_evaluator_fallback");

  const reasons: string[] = [];
  for (const item of checklist.items) {
    if (!item.blocking) continue;
    const res = checklist.results.find((r) => r.itemId === item.id);
    if (res && !res.passed) reasons.push(humanReason(item.id, checklist));
  }
  if (checklist.blockingIssues.includes("qc_evaluator_fallback")) {
    reasons.push("Compliance evaluation could not be completed — verification required.");
  }

  const dedup = [...new Set(reasons)];
  return {
    listingId,
    allowed,
    reasons: dedup,
    blockingIssues,
    readinessScore: checklist.readinessScore,
  };
}

export function buildListingComplianceDecision(params: {
  listingId: string;
  evaluatorInput: QuebecComplianceEvaluatorInput;
}): ListingComplianceDecision {
  try {
    const checklist = evaluateQuebecCompliance(params.evaluatorInput);
    return listingComplianceDecisionFromChecklist(params.listingId, checklist);
  } catch {
    return {
      listingId: params.listingId,
      allowed: false,
      reasons: ["Compliance evaluation requires verification — publishing is paused."],
      blockingIssues: ["qc_evaluator_fallback"],
      readinessScore: 0,
    };
  }
}

/** Single evaluation pass — use when both checklist surface and publish decision must stay aligned. */
export function evaluateListingComplianceBundle(params: {
  listingId: string;
  evaluatorInput: QuebecComplianceEvaluatorInput;
}): { checklist: QuebecComplianceChecklistResult | null; decision: ListingComplianceDecision } {
  try {
    const checklist = evaluateQuebecCompliance(params.evaluatorInput);
    return {
      checklist,
      decision: listingComplianceDecisionFromChecklist(params.listingId, checklist),
    };
  } catch {
    return {
      checklist: null,
      decision: {
        listingId: params.listingId,
        allowed: false,
        reasons: ["Compliance evaluation requires verification — publishing is paused."],
        blockingIssues: ["qc_evaluator_fallback"],
        readinessScore: 0,
      },
    };
  }
}
