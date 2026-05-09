/**
 * Compliance Engine — server-side checks.
 *
 * These functions are the single entry point for regulatory guardrails.
 * All hubs call these instead of implementing their own compliance logic.
 *
 * IMPORTANT: Every placeholder rule is marked with TODO_COMPLIANCE_VERIFY.
 * No fake legal claims. Only real implemented rules return non-placeholder results.
 */

import { COMPLIANCE_CODES } from "../constants";
import type {
  ComplianceCheckResult,
  ComplianceGateResult,
  ComplianceSeverity,
  RegulatedAction,
} from "../types";

function placeholder(code: string, message: string, severity: ComplianceSeverity = "blocking"): ComplianceCheckResult {
  return {
    passed: false,
    severity,
    code,
    message,
    isPlaceholder: true,
  };
}

/**
 * Check if a listing can be published.
 *
 * TODO_COMPLIANCE_VERIFY: Real OACIQ publication rules must be verified
 * with a licensed Quebec real estate compliance advisor before production.
 */
export function canPublishListing(_listingId: string): ComplianceGateResult {
  const checks: ComplianceCheckResult[] = [
    placeholder(
      COMPLIANCE_CODES.LISTING_INCOMPLETE,
      "Listing completeness check not yet implemented.",
      "warning"
    ),
    placeholder(
      COMPLIANCE_CODES.OACIQ_DISCLOSURE_MISSING,
      "OACIQ disclosure verification not yet implemented.",
    ),
  ];

  const blockingReasons = checks.filter((c) => !c.passed && c.severity === "blocking").map((c) => c.message);
  return { allowed: blockingReasons.length === 0, checks, blockingReasons };
}

/**
 * Check if a broker review is required for an action.
 *
 * TODO_COMPLIANCE_VERIFY: Broker review thresholds must be defined by
 * licensed compliance staff.
 */
export function requiresBrokerReview(_action: RegulatedAction): boolean {
  const reviewRequired: RegulatedAction[] = [
    "accept_offer",
    "sign_contract",
    "submit_seller_declaration",
  ];
  return reviewRequired.includes(_action);
}

/**
 * Check for missing required forms for a transaction.
 *
 * TODO_COMPLIANCE_VERIFY: Required forms list varies by transaction type
 * and Quebec region. Must be validated with OACIQ guidelines.
 */
export function missingRequiredForms(_transactionId: string): string[] {
  return [
    "TODO_COMPLIANCE_VERIFY: Seller Declaration form check not implemented",
    "TODO_COMPLIANCE_VERIFY: OACIQ Disclosure form check not implemented",
  ];
}

/**
 * Determine audit severity for a compliance event.
 */
export function auditSeverity(action: RegulatedAction): ComplianceSeverity {
  switch (action) {
    case "process_payment":
    case "sign_contract":
      return "critical";
    case "accept_offer":
    case "submit_seller_declaration":
      return "blocking";
    case "publish_listing":
    case "onboard_host":
    case "broker_assignment":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Get blocking reasons for any regulated action.
 * Returns a blocking result for any unknown action (fail-closed).
 */
export function blockingReasons(action: RegulatedAction): string[] {
  return [
    `TODO_COMPLIANCE_VERIFY: Full compliance check for '${action}' not yet implemented. Blocking by default (fail-closed).`,
  ];
}
