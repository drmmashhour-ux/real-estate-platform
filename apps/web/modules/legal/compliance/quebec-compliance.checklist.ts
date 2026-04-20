/**
 * Deterministic Québec compliance item registry — no runtime logic beyond list selection.
 */

import type { QuebecComplianceDomain, QuebecComplianceItem } from "./quebec-compliance.types";

const LISTING_SELLER: QuebecComplianceItem[] = [
  {
    id: "qc_listing_ownership_proof_present",
    domain: "listing",
    label: "Ownership documentation",
    description: "Evidence of ownership is required before publication.",
    required: true,
    severity: "critical",
    evidenceKeys: ["ownership_doc_slot", "proof_of_ownership_record"],
    blocking: true,
  },
  {
    id: "qc_listing_seller_declaration_complete",
    domain: "seller",
    label: "Seller declaration",
    description: "Structured seller declaration must be completed.",
    required: true,
    severity: "critical",
    evidenceKeys: ["seller_declaration_json", "seller_declaration_completed_at"],
    blocking: true,
  },
  {
    id: "qc_listing_property_basic_data_present",
    domain: "listing",
    label: "Core listing facts",
    description: "Price, property type, and a complete address are required.",
    required: true,
    severity: "critical",
    evidenceKeys: ["priceCents", "propertyType", "address", "city"],
    blocking: true,
  },
  {
    id: "qc_listing_no_internal_conflicts_in_declaration",
    domain: "seller",
    label: "Declaration consistency",
    description: "Seller declaration must not contain unresolved contradictory structured answers.",
    required: true,
    severity: "critical",
    evidenceKeys: ["seller_declaration_json", "legal_record_validation"],
    blocking: true,
  },
  {
    id: "qc_listing_required_disclosures_present",
    domain: "seller",
    label: "Mandatory acknowledgements",
    description: "Required disclosure acknowledgements should be on file.",
    required: false,
    severity: "warning",
    evidenceKeys: ["legal_accuracy_accepted_at"],
    blocking: false,
  },
];

const BROKER: QuebecComplianceItem[] = [
  {
    id: "qc_broker_license_reference_present",
    domain: "broker",
    label: "Broker licence verification",
    description: "Broker-managed listings require a verified licence reference.",
    required: true,
    severity: "critical",
    evidenceKeys: ["broker_license_verified"],
    blocking: true,
  },
  {
    id: "qc_broker_brokerage_identification_present",
    domain: "broker",
    label: "Brokerage identification",
    description: "Brokerage context should be identifiable for compliance review.",
    required: false,
    severity: "warning",
    evidenceKeys: ["tenant_id", "listing_code"],
    blocking: false,
  },
];

const LANDLORD: QuebecComplianceItem[] = [
  {
    id: "qc_landlord_lease_terms_present",
    domain: "landlord",
    label: "Lease terms",
    description: "Material lease/rental terms must be represented for rental listings.",
    required: true,
    severity: "critical",
    evidenceKeys: ["seller_declaration_json.rent_terms", "lease_document_category"],
    blocking: true,
  },
  {
    id: "qc_landlord_rental_conditions_defined",
    domain: "landlord",
    label: "Rental conditions",
    description: "Basic rental operating conditions should be stated.",
    required: false,
    severity: "warning",
    evidenceKeys: ["seller_declaration_json.rental_conditions"],
    blocking: false,
  },
];

const SHORT_TERM: QuebecComplianceItem[] = [
  {
    id: "qc_str_registration_number_present",
    domain: "short_term_rental",
    label: "Short-term registration",
    description: "Registration identifier is required where applicable.",
    required: true,
    severity: "critical",
    evidenceKeys: ["bnhub_registration_number", "seller_declaration_json.str_registration"],
    blocking: true,
  },
  {
    id: "qc_str_local_authorization_present",
    domain: "short_term_rental",
    label: "Local authorization",
    description: "Local authorization posture must be indicated.",
    required: true,
    severity: "critical",
    evidenceKeys: ["seller_declaration_json.local_authorization"],
    blocking: true,
  },
  {
    id: "qc_str_capacity_limits_defined",
    domain: "short_term_rental",
    label: "Occupancy limits",
    description: "Occupancy or capacity limits should be defined.",
    required: false,
    severity: "warning",
    evidenceKeys: ["seller_declaration_json.capacity_limits"],
    blocking: false,
  },
];

const GENERAL: QuebecComplianceItem[] = [
  {
    id: "qc_general_identity_document_verified",
    domain: "listing",
    label: "Identity verification",
    description: "Identity verification must reach an acceptable status.",
    required: true,
    severity: "critical",
    evidenceKeys: ["id_proof_slot", "verification_identity_status"],
    blocking: true,
  },
  {
    id: "qc_general_no_high_risk_legal_indicators",
    domain: "listing",
    label: "Operational legal signals",
    description: "Elevated operational compliance markers must be reviewed before publication.",
    required: true,
    severity: "critical",
    evidenceKeys: ["legal_intelligence_critical_count"],
    blocking: true,
  },
  {
    id: "qc_general_no_unresolved_rejection_loops",
    domain: "listing",
    label: "Document review stability",
    description: "Repeated review failures must be resolved.",
    required: true,
    severity: "critical",
    evidenceKeys: ["document_rejection_loop", "moderation_status"],
    blocking: true,
  },
];

const ALL_ITEMS: QuebecComplianceItem[] = [
  ...LISTING_SELLER,
  ...BROKER,
  ...LANDLORD,
  ...SHORT_TERM,
  ...GENERAL,
];

export function getQuebecComplianceChecklist(domain: QuebecComplianceDomain): QuebecComplianceItem[] {
  return ALL_ITEMS.filter((i) => i.domain === domain).sort((a, b) => a.id.localeCompare(b.id));
}

/** Merge unique items for multi-domain evaluation (deterministic order). */
export function mergeQuebecComplianceChecklists(domains: QuebecComplianceDomain[]): QuebecComplianceItem[] {
  const seen = new Set<string>();
  const out: QuebecComplianceItem[] = [];
  const order = [...domains].sort();
  for (const d of order) {
    for (const item of getQuebecComplianceChecklist(d)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
