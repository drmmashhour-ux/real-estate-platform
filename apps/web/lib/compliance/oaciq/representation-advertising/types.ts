/** OACIQ — Representation, Solicitation, Promotion and Advertising (rule schema). */

export type ComplianceRuleCategory = "representation" | "solicitation" | "promotion" | "advertising";

export type ComplianceRuleRiskLevel = "low" | "medium" | "high";

export type ComplianceRule = {
  id: string;
  category: ComplianceRuleCategory;
  trigger: string;
  condition: string;
  violation: string;
  required_action?: string;
  prohibited_action?: string;
  risk_level: ComplianceRuleRiskLevel;
  source: "OACIQ";
};

export type RepresentationAdvertisingViolation = {
  rule: string;
  message: string;
  risk_level: ComplianceRuleRiskLevel;
  category: ComplianceRuleCategory;
};

export type RepresentationAdvertisingEvaluation = {
  compliant: boolean;
  /** When true, publish / public advertising flows should reject (policy). */
  blockPublish: boolean;
  violations: RepresentationAdvertisingViolation[];
  risk_score: number;
  triggered_rule_ids: string[];
};

/** Normalized inputs — populated from DB + listing copy (deterministic gates). */
export type ListingAdvertisingComplianceContext = {
  intendedForPublicAdvertising: boolean;
  /** Title + assistant draft + any marketing surfaces to scan */
  marketingText: string;
  isComingSoonOrTeaser: boolean;
  isSoldOrCompleted: boolean;
  /** Listing still exposes a numeric ask after transaction (policy heuristic). */
  publicAdShowsNumericPriceWhenSold: boolean;
  /** Title/body indicates sold state */
  displaysSoldLabel: boolean;
  broker: {
    holdsValidBrokerageLicense: boolean;
    /** Licence name appears in creative (heuristic substring match). */
    licensedNameDisplayedInCreative: boolean;
    licenceDesignationPresent: boolean;
    hasSignedBrokerageContractForThisMandate: boolean;
    isSolicitingAnotherBrokersExclusive: boolean;
    offersReferralGiftOrCommissionKickback: boolean;
    isAgencyOperation: boolean;
    agencyHasDocumentedSupervision: boolean;
  };
};
