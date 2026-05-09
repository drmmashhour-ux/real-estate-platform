/**
 * Compliance Engine — shared types.
 *
 * Used by all hubs that need regulatory guardrails (Homes, BNHub, Forms).
 */

export type ComplianceSeverity = "info" | "warning" | "blocking" | "critical";

export type ComplianceCheckResult = {
  passed: boolean;
  severity: ComplianceSeverity;
  code: string;
  message: string;
  /** Set when the rule is a placeholder not yet implemented. */
  isPlaceholder: boolean;
};

export type ComplianceGateResult = {
  allowed: boolean;
  checks: ComplianceCheckResult[];
  blockingReasons: string[];
};

export type RegulatedAction =
  | "publish_listing"
  | "accept_offer"
  | "sign_contract"
  | "process_payment"
  | "onboard_host"
  | "submit_seller_declaration"
  | "broker_assignment";
