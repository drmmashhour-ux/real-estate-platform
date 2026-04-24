/**
 * Complaint governance rule pack registration surface for the centralized compliance engine.
 * Categories: complaints, consumer_protection, oaciq_collaboration.
 */

export const COMPLAINT_GOVERNANCE_RULE_PACK_ID = "lecipm_complaint_governance_v1";

export const COMPLAINT_GOVERNANCE_CATEGORIES = ["complaints", "consumer_protection", "oaciq_collaboration"] as const;

export type ComplaintGovernanceCategory = (typeof COMPLAINT_GOVERNANCE_CATEGORIES)[number];

/** Triggers documented for ops / future schedulers (no background worker in this slice). */
export const COMPLAINT_GOVERNANCE_EVAL_TRIGGERS = [
  "complaint_created",
  "support_case_created",
  "compliance_case_ethics_flag",
  "compliance_case_trust_aml_flag",
  "compliance_case_misleading_ad_flag",
  "compliance_case_record_flag",
] as const;
