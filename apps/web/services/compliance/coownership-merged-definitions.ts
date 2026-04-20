import type { ChecklistItemCategory, ChecklistPriority } from "@prisma/client";

export type MergedChecklistDef = {
  key: string;
  label: string;
  description?: string;
  category: ChecklistItemCategory;
  priority: ChecklistPriority;
  required: boolean;
  source?: string;
};

/**
 * Merged LECIPM co-ownership + insurance verification (30 items). Idempotent `createMany` by (listingId, key).
 * Platform guidance only — not legal or insurance advice.
 */
export const MERGED_COOWNERSHIP_CHECKLIST: readonly MergedChecklistDef[] = [
  {
    key: "coownership_certificate_requested",
    label: "Certificate of co-ownership condition requested",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
    source: "CCQ_1068_1",
  },
  {
    key: "coownership_certificate_received",
    label: "Certificate of co-ownership condition received",
    category: "COOWNERSHIP",
    priority: "CRITICAL",
    required: true,
    source: "CCQ_1068_1",
  },
  {
    key: "coownership_certificate_reviewed",
    label: "Certificate reviewed and complete",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
    source: "CCQ_1068_1",
  },
  {
    key: "coownership_certificate_provided_to_buyer",
    label: "Certificate provided to buyer",
    category: "COOWNERSHIP",
    priority: "CRITICAL",
    required: true,
    source: "CCQ_1068_1",
  },
  {
    key: "maintenance_log_verified",
    label: "Maintenance log verified",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
  },
  {
    key: "contingency_fund_study_verified",
    label: "Contingency fund study verified",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
  },
  {
    key: "financial_statements_reviewed",
    label: "Financial statements reviewed (last 3 years)",
    category: "COOWNERSHIP",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "budget_forecast_reviewed",
    label: "Budget forecast reviewed",
    category: "COOWNERSHIP",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "disputes_reviewed",
    label: "Ongoing disputes reviewed",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
  },
  {
    key: "past_damages_reviewed",
    label: "Past damages reviewed (last 5 years)",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
  },
  {
    key: "major_repairs_reviewed",
    label: "Major repairs completed reviewed",
    category: "COOWNERSHIP",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "planned_repairs_reviewed",
    label: "Planned repairs reviewed (next 10 years)",
    category: "COOWNERSHIP",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "seller_informed_of_obligations",
    label: "Seller informed of obligations",
    category: "COOWNERSHIP",
    priority: "HIGH",
    required: true,
    source: "CCQ_1068_1",
  },
  {
    key: "coowner_insurance_verified",
    label: "Co-owner insurance policy verified",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
  },
  {
    key: "coowner_liability_minimum_verified",
    label: "Co-owner liability minimum verified",
    description: "≥ $1M if fewer than 13 units, ≥ $2M if 13+ units",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
  },
  {
    key: "coowner_improvements_coverage_verified",
    label: "Coverage for private portion improvements verified",
    category: "INSURANCE",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "syndicate_property_insurance_verified",
    label: "Syndicate property insurance verified",
    category: "INSURANCE",
    priority: "CRITICAL",
    required: true,
    source: "CCQ_1073",
  },
  {
    key: "syndicate_reconstruction_value_verified",
    label: "Insurance amount covers reconstruction value",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
    source: "CCQ_1073",
  },
  {
    key: "syndicate_valuation_within_5_years_verified",
    label: "Insurance valuation completed within 5 years",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
    source: "CCQ_1073",
  },
  {
    key: "syndicate_third_party_liability_verified",
    label: "Syndicate third-party liability insurance verified",
    category: "INSURANCE",
    priority: "CRITICAL",
    required: true,
    source: "CCQ_1073",
  },
  {
    key: "board_liability_insurance_verified",
    label: "Board of directors liability insurance verified",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
  },
  {
    key: "manager_liability_insurance_verified",
    label: "Manager liability insurance verified",
    category: "INSURANCE",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "meeting_officers_liability_verified",
    label: "Meeting officers liability insurance verified",
    category: "INSURANCE",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "risk_coverage_verified",
    label: "Property insurance includes ordinary risks",
    description:
      "fire, theft, lightning, storm, vandalism, civil disturbance, vehicle/aircraft impact",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
  },
  {
    key: "self_insurance_fund_verified",
    label: "Self-insurance fund verified",
    category: "INSURANCE",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "deductible_reasonableness_reviewed",
    label: "Deductible reasonableness reviewed",
    category: "INSURANCE",
    priority: "MEDIUM",
    required: true,
  },
  {
    key: "insurance_documents_obtained",
    label: "Insurance documents obtained",
    category: "INSURANCE",
    priority: "HIGH",
    required: true,
  },
  {
    key: "buyer_informed_if_insurance_missing",
    label: "Buyer informed if insurance is missing",
    category: "INSURANCE",
    priority: "CRITICAL",
    required: false,
  },
  {
    key: "conditional_offer_recommended_if_needed",
    label: "Conditional offer recommended if insurance is missing",
    category: "INSURANCE",
    priority: "HIGH",
    required: false,
  },
  {
    key: "buyer_referred_to_insurance_expert_if_needed",
    label: "Buyer referred to insurance expert if needed",
    category: "INSURANCE",
    priority: "LOW",
    required: false,
  },
];

export const MERGED_KEYS = new Set(MERGED_COOWNERSHIP_CHECKLIST.map((d) => d.key));
export const DEF_BY_MERGED_KEY = new Map(MERGED_COOWNERSHIP_CHECKLIST.map((d) => [d.key, d]));

/** Enforcement / autopilot — critical path (§8). */
export const CRITICAL_COMPLIANCE_BLOCK_KEYS = [
  "coownership_certificate_received",
  "coownership_certificate_reviewed",
  "coownership_certificate_provided_to_buyer",
  "syndicate_property_insurance_verified",
  "syndicate_third_party_liability_verified",
] as const;

/** Legacy insurance gate alignment + co-owner liability */
export const INSURANCE_GATE_KEYS = [
  "coowner_liability_minimum_verified",
  "syndicate_property_insurance_verified",
  "syndicate_third_party_liability_verified",
] as const;

export const CONDITIONAL_INSURANCE_TRIGGER_KEYS = [
  "coowner_insurance_verified",
  "syndicate_property_insurance_verified",
  "syndicate_third_party_liability_verified",
] as const;

export const CONDITIONAL_WHEN_INSURANCE_GAP_KEYS = [
  "buyer_informed_if_insurance_missing",
  "conditional_offer_recommended_if_needed",
] as const;
