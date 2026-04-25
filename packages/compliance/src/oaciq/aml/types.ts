/** OACIQ-aligned AML / FINTRAC posture — deterministic rule catalog + evaluation (broker remains accountable). */

export type AMLSeverity = "low" | "medium" | "high" | "critical";

export type AMLCheck = {
  id: string;
  trigger: string;
  condition: string;
  violation: string;
  required_action?: string;
  prohibited_action?: string;
  risk_score: number;
  severity: AMLSeverity;
  source: "OACIQ_AML";
};

export type AMLViolation = {
  rule: string;
  message: string;
  severity: AMLSeverity;
  risk_score: number;
  source: "OACIQ_AML";
};

export type AMLGate = "OK" | "REVIEW_REQUIRED" | "BLOCK";

export type AMLEvaluation = {
  compliant: boolean;
  violations: AMLViolation[];
  triggered_rule_ids: string[];
  /** Average of triggered rule `risk_score` values; 0 when no triggers. */
  risk_score: number;
  gate: AMLGate;
};

/** Inputs for deterministic evaluation — map from KYC, trust ledger, deal analysis, etc. */
export type DealAMLComplianceContext = {
  illegalActivitySuspected: boolean;
  identityVerified: boolean;
  legalCapacityConfirmed: boolean;
  trustAccountHoldsUnrelatedFunds: boolean;
  suspiciousPatternDetected: boolean;
  /** When true, record-keeping rule may apply. */
  transactionCompleted: boolean;
  /** Records complete and available within regulatory access windows. */
  recordsCompleteAndAccessible: boolean;
  reportingObligationsUpToDate: boolean;
  priceVsDeclaredValueMismatch: boolean;
  nomineeOrHiddenBeneficiarySuspected: boolean;
  structuringPatternSuspected: boolean;
  transactionAbnormallyFastWithoutJustification: boolean;
  mortgageExceedsPropertyValue: boolean;
};

export type BrokerAMLApprovalPayload = {
  ai_status: AMLSeverity;
  summary: string;
  broker_action: AMLGate;
  requires_signature: boolean;
};
