/**
 * OACIQ — Verification, Information and Advice (platform encoding).
 * Reference guideline: Vérification, information et conseils (OACIQ).
 * AI assists only; the broker verifies, informs, and advises within professional duties.
 */

export const OACIQ_VERIFICATION_ENGINE = {
  sourcesRequired: [
    "public_records",
    "seller_declaration",
    "inspection_reports",
    "municipal_data",
    "comparable_sales",
  ],
  checks: ["data_consistency", "missing_information", "risk_factors"],
} as const;

export const OACIQ_INFORMATION_ENGINE = {
  requirements: ["full_disclosure", "no_bias", "no_omission"],
} as const;

export const OACIQ_ADVICE_ENGINE = {
  requires: ["verification_complete", "client_context", "market_data"],
} as const;

export const OACIQ_INSPECTION_RULES = {
  buyerMustBeAdvised: true,
  preInspectionNotEnough: true,
} as const;

/** Minimum peer comparables before emitting a numeric price band as “advice”. */
export const MIN_COMPARABLES_FOR_PRICE_ADVICE = 3;

export const OACIQ_PRICING_ENGINE = {
  requiredInputs: ["comparables", "market_conditions", "property_characteristics"],
  forbidden: ["guessing", "unsupported_estimates"],
  minComparables: MIN_COMPARABLES_FOR_PRICE_ADVICE,
} as const;

export const OACIQ_LEGAL_WARRANTY_ENGINE = {
  mustExplain: true,
  mustIncludeInContract: true,
  topics: ["ownership_clear_of_undeclared_encumbrances", "quality_latent_defects_unless_declared"],
} as const;

export const OACIQ_VIA_RISK_ENGINE = {
  highRiskIf: ["missing_verification", "incomplete_data", "uncertain_property_status"],
} as const;

export const OACIQ_VIA_SIGNATURE_CHAIN = ["broker_review", "broker_confirmation", "broker_signature"] as const;
