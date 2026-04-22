/**
 * Solo-broker compliance engine — pure decisions for gates, logging, and UI.
 * Final decisions remain with the licensed broker (manual approval / signature).
 */

import type { BrokerOnlyAction, ComplianceGateOutcome, ComplianceRiskTier } from "./types";

/** All actions that must be denied for non-brokers or unverified broker roles. */
export const BROKER_ONLY_ACTIONS: readonly BrokerOnlyAction[] = [
  "represent_client",
  "negotiate",
  "draft_offer",
  "advise",
  "execute_mandate",
  "present_counter_offer",
] as const;

export function isBrokerOnlyAction(action: string): action is BrokerOnlyAction {
  return (BROKER_ONLY_ACTIONS as readonly string[]).includes(action);
}

/** `isLicensedBroker`: user holds broker licence / platform treats them as broker role for REBA-scoped work. */
export function evaluateBrokerOnlyGate(params: {
  action: BrokerOnlyAction;
  isLicensedBroker: boolean;
  actsWithinLicenceScope: boolean;
}): ComplianceGateOutcome {
  if (!params.isLicensedBroker) {
    return { decision: "blocked", tier: "HIGH", reasonCode: "NON_BROKER_BROKER_ONLY_ACTION" };
  }
  if (!params.actsWithinLicenceScope) {
    return { decision: "blocked", tier: "HIGH", reasonCode: "OUTSIDE_LICENCE_SCOPE" };
  }
  return { decision: "allowed", tier: "LOW" };
}

/**
 * Licence gate at onboarding / session (adapted OACIQ selection).
 * Strict: invalid licence blocks platform access for broker-professional flows.
 */
export function evaluateLicenceAccessGate(params: { licenceRecordValid: boolean }): ComplianceGateOutcome {
  if (!params.licenceRecordValid) {
    return { decision: "blocked", tier: "HIGH", reasonCode: "OACIQ_LICENCE_INVALID_OR_UNKNOWN" };
  }
  return { decision: "allowed", tier: "LOW" };
}

/** Pending checks → warning paths; callers may still restrict writes. */
export function evaluateVerificationSoftGate(params: {
  identityVerified: boolean;
  integrityCleared: boolean;
  competenceAcknowledged: boolean;
}): ComplianceGateOutcome {
  const missing: string[] = [];
  if (!params.identityVerified) missing.push("identity");
  if (!params.integrityCleared) missing.push("integrity");
  if (!params.competenceAcknowledged) missing.push("competence_ack");

  if (missing.length === 0) {
    return { decision: "allowed", tier: "LOW" };
  }
  if (missing.length >= 2) {
    return {
      decision: "warning",
      tier: "MEDIUM",
      reasonCode: `MISSING_CHECKS:${missing.join(",")}`,
    };
  }
  return {
    decision: "warning",
    tier: "MEDIUM",
    reasonCode: `MISSING_CHECK:${missing[0]}`,
  };
}

export function classifyRiskTier(params: {
  illegalOrNonBrokerAttempt: boolean;
  scopeViolation: boolean;
  missingComplianceElements: boolean;
}): ComplianceRiskTier {
  if (params.illegalOrNonBrokerAttempt || params.scopeViolation) return "HIGH";
  if (params.missingComplianceElements) return "MEDIUM";
  return "LOW";
}

/** Escalate UX when repeated issues occur (§5 feedback loop — product behaviour). */
export function confirmationStrength(params: {
  recentWarningCount: number;
  recentBlockedCount: number;
}): "standard" | "strong" | "strict" {
  if (params.recentBlockedCount >= 2) return "strict";
  if (params.recentWarningCount >= 3 || params.recentBlockedCount >= 1) return "strong";
  return "standard";
}

/** Whether the UI must show broker responsibility copy + explicit confirm (§8). */
export function requiresBrokerAcknowledgement(action: BrokerOnlyAction): boolean {
  void action;
  return true;
}
