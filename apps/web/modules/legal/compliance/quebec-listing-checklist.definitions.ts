/**
 * Québec-focused platform publish checklist — deterministic predicates only; does not certify legality off-platform.
 */

import type { QuebecComplianceEvaluatorInput } from "./quebec-compliance-evaluator.service";

/** Domains surfaced to admin / ranking (logical grouping beyond legacy evaluator domains). */
export type QuebecListingChecklistDomain =
  | "core_listing"
  | "seller"
  | "broker"
  | "rental"
  | "short_term_rental"
  | "identity"
  | "ownership"
  | "disclosures"
  | "privacy"
  | "risk_controls";

export type QuebecListingChecklistDefinition = {
  id: string;
  checklistDomain: QuebecListingChecklistDomain;
  /** When present, evaluation reuses legacy `evaluateQuebecCompliance` result for this id */
  legacyItemId?: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  blocking: boolean;
  evidenceKeys: string[];
  safeUserMessage: string;
  adminMessage: string;
  requiredWhen: (ctx: QuebecComplianceEvaluatorInput) => boolean;
};

function caQcListing(L: QuebecComplianceEvaluatorInput["listing"]): boolean {
  const c = String(L.country ?? "").toUpperCase();
  const r = String(L.region ?? "").trim().toUpperCase();
  return c === "CA" && (r === "" || r === "QC" || r === "QUEBEC" || r === "QUÉBEC");
}

export function sellerDeclarationIndicatesRental(json: QuebecComplianceEvaluatorInput["listing"]["sellerDeclarationJson"]): boolean {
  try {
    if (!json || typeof json !== "object") return false;
    const o = json as Record<string, unknown>;
    return ["rentAmount", "leaseEnd", "tenantOccupied", "rentalIncome", "longTermRental"].some(
      (k) => o[k] != null && String(o[k]).trim() !== "",
    );
  } catch {
    return false;
  }
}

function strMode(ctx: QuebecComplianceEvaluatorInput): boolean {
  const d = String(ctx.listing.listingDealType ?? "").toUpperCase();
  return d.includes("SHORT") || d.includes("BNHUB") || d.includes("STAY");
}

function rentalMode(ctx: QuebecComplianceEvaluatorInput): boolean {
  const d = String(ctx.listing.listingDealType ?? "").toUpperCase();
  return d.includes("RENT") || d.includes("LEASE") || sellerDeclarationIndicatesRental(ctx.listing.sellerDeclarationJson);
}

function brokerFlow(ctx: QuebecComplianceEvaluatorInput): boolean {
  return ctx.listing.listingOwnerType === "BROKER";
}

/** Definitions registry — built programmatically for maintainability */
function buildDefinitions(): QuebecListingChecklistDefinition[] {
  const core: QuebecListingChecklistDefinition[] = [
    {
      id: "ql_core_listing_status_allows_publish",
      checklistDomain: "core_listing",
      label: "Listing moderation posture",
      description: "Platform moderation must allow progression toward publish.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["moderation_status"],
      safeUserMessage: "Please resolve the following items before publishing.",
      adminMessage: "Blocked by moderation status for platform publish requirements.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_core_address_present",
      checklistDomain: "core_listing",
      legacyItemId: "qc_listing_property_basic_data_present",
      label: "Address and core facts",
      description: "Valid address, price, and property type are required for catalog publication.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["address", "city", "priceCents", "propertyType"],
      safeUserMessage: "Complete required property information before publishing.",
      adminMessage: "Critical compliance failure: core listing facts incomplete.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_ownership_proof_present",
      checklistDomain: "ownership",
      legacyItemId: "qc_listing_ownership_proof_present",
      label: "Ownership documentation",
      description: "Evidence of ownership or validated ownership pathway for publish.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["ownership_doc_slot", "proof_of_ownership_record"],
      safeUserMessage: "Upload or complete ownership verification as required.",
      adminMessage: "Ownership proof missing for Québec publish posture.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_seller_declaration_present",
      checklistDomain: "seller",
      legacyItemId: "qc_listing_seller_declaration_complete",
      label: "Seller declaration",
      description: "Structured declaration completed when required for residential sale posture.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["seller_declaration_json", "seller_declaration_completed_at"],
      safeUserMessage: "Complete required disclosure information before publishing.",
      adminMessage: "Seller declaration incomplete for platform publish requirements.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_declaration_consistency",
      checklistDomain: "seller",
      legacyItemId: "qc_listing_no_internal_conflicts_in_declaration",
      label: "Declaration consistency",
      description: "No unresolved contradictory structured answers for publish.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["seller_declaration_json", "legal_record_validation"],
      safeUserMessage: "Please resolve inconsistent answers in your declaration.",
      adminMessage: "Critical declaration inconsistency flagged for review.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_broker_license",
      checklistDomain: "broker",
      legacyItemId: "qc_broker_license_reference_present",
      label: "Broker licence verification",
      description: "Broker-flow listings require licence verification reference on platform.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["broker_license_verified"],
      safeUserMessage: "Additional verification is required for broker-managed listings.",
      adminMessage: "Broker licence reference missing for broker-flow publish.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && brokerFlow(ctx),
    },
    {
      id: "ql_brokerage_identification",
      checklistDomain: "broker",
      legacyItemId: "qc_broker_brokerage_identification_present",
      label: "Brokerage identification",
      description: "Brokerage / listing code context should be present for broker inventory.",
      severity: "warning",
      blocking: false,
      evidenceKeys: ["tenant_id", "listing_code"],
      safeUserMessage: "Complete brokerage identification details where applicable.",
      adminMessage: "Brokerage identification thin — advisory.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && brokerFlow(ctx),
    },
    {
      id: "ql_rental_lease_terms",
      checklistDomain: "rental",
      legacyItemId: "qc_landlord_lease_terms_present",
      label: "Lease / rental terms",
      description: "Rental listings require material rental terms representation.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["seller_declaration_json.rent_terms"],
      safeUserMessage: "Complete required rental information before publishing.",
      adminMessage: "Rental terms missing for rental-mode listing.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && rentalMode(ctx),
    },
    {
      id: "ql_rental_conditions",
      checklistDomain: "rental",
      legacyItemId: "qc_landlord_rental_conditions_defined",
      label: "Rental operating conditions",
      description: "Basic rental operating conditions should be stated.",
      severity: "warning",
      blocking: false,
      evidenceKeys: ["seller_declaration_json.rental_conditions"],
      safeUserMessage: "Add rental operating conditions to improve readiness.",
      adminMessage: "Rental conditions advisory.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && rentalMode(ctx),
    },
    {
      id: "ql_str_registration",
      checklistDomain: "short_term_rental",
      legacyItemId: "qc_str_registration_number_present",
      label: "Short-term registration identifier",
      description: "Registration identifier posture for short-term tourist accommodation flows.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["seller_declaration_json.str_registration"],
      safeUserMessage: "Provide registration details required for your listing category.",
      adminMessage: "STR registration identifier missing for STR posture.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && strMode(ctx),
    },
    {
      id: "ql_str_authorization",
      checklistDomain: "short_term_rental",
      legacyItemId: "qc_str_local_authorization_present",
      label: "Local authorization posture",
      description: "Local authorization indicators for applicable STR listings.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["seller_declaration_json.local_authorization"],
      safeUserMessage: "Provide local authorization details required for your listing category.",
      adminMessage: "STR local authorization missing.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && strMode(ctx),
    },
    {
      id: "ql_str_capacity",
      checklistDomain: "short_term_rental",
      legacyItemId: "qc_str_capacity_limits_defined",
      label: "Occupancy limits",
      description: "Occupancy / capacity limits for STR listings.",
      severity: "warning",
      blocking: false,
      evidenceKeys: ["seller_declaration_json.capacity_limits"],
      safeUserMessage: "Define occupancy limits to improve readiness.",
      adminMessage: "STR occupancy limits advisory.",
      requiredWhen: (ctx) => caQcListing(ctx.listing) && strMode(ctx),
    },
    {
      id: "ql_identity_verification",
      checklistDomain: "identity",
      legacyItemId: "qc_general_identity_document_verified",
      label: "Identity verification",
      description: "Identity pathway completion when required before publish.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["id_proof_slot", "verification_identity_status"],
      safeUserMessage: "Additional identity verification is required.",
      adminMessage: "Identity verification incomplete for publish posture.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_disclosures_acknowledgements",
      checklistDomain: "disclosures",
      legacyItemId: "qc_listing_required_disclosures_present",
      label: "Mandatory acknowledgements",
      description: "Required disclosure acknowledgements recorded where applicable.",
      severity: "warning",
      blocking: false,
      evidenceKeys: ["legal_accuracy_accepted_at"],
      safeUserMessage: "Complete acknowledgements where prompted.",
      adminMessage: "Mandatory acknowledgements advisory.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_risk_fraud_critical",
      checklistDomain: "risk_controls",
      legacyItemId: "qc_general_no_high_risk_legal_indicators",
      label: "Operational compliance markers",
      description: "No unresolved critical operational compliance markers for publish.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["legal_intelligence", "fraud_indicators", "rule_results"],
      safeUserMessage: "Additional verification is required before publishing.",
      adminMessage: "Critical operational compliance markers — publish blocked pending review.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
    {
      id: "ql_risk_rejection_loop",
      checklistDomain: "risk_controls",
      legacyItemId: "qc_general_no_unresolved_rejection_loops",
      label: "Document review stability",
      description: "Unresolved rejection loop patterns must be cleared.",
      severity: "critical",
      blocking: true,
      evidenceKeys: ["document_rejection_loop"],
      safeUserMessage: "Please resolve outstanding document review items.",
      adminMessage: "Document rejection loop detected.",
      requiredWhen: (ctx) => caQcListing(ctx.listing),
    },
  ];
  return core;
}

let _cache: QuebecListingChecklistDefinition[] | null = null;

/** All definition rows (predicates identify when each applies). */
export function getQuebecListingChecklist(params: { evaluatorInput: QuebecComplianceEvaluatorInput }): QuebecListingChecklistDefinition[] {
  if (!_cache) _cache = buildDefinitions();
  const ctx = params.evaluatorInput;
  return _cache.filter((d) => {
    try {
      return d.requiredWhen(ctx);
    } catch {
      return false;
    }
  });
}

/** Domains that apply for this listing shape (deterministic ordering). */
export function getChecklistDomainsForListing(listing: QuebecComplianceEvaluatorInput["listing"]): QuebecListingChecklistDomain[] {
  const wrap: QuebecComplianceEvaluatorInput = {
    primaryDomain: "listing",
    domains: ["listing", "seller", "broker", "landlord", "short_term_rental"],
    listing,
  };
  const defs = getQuebecListingChecklist({ evaluatorInput: wrap });
  const active = new Set<QuebecListingChecklistDomain>();
  for (const d of defs) active.add(d.checklistDomain);
  return [...active].sort();
}
