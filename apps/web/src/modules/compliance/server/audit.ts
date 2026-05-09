/**
 * Compliance Audit Trail — server-side audit logging.
 *
 * Records compliance-relevant events for regulatory review.
 * TODO_COMPLIANCE_VERIFY: Audit retention period and format must be
 * verified with Quebec privacy/compliance requirements.
 */

import type { ComplianceSeverity, RegulatedAction } from "../types";

export interface ComplianceAuditEntry {
  timestamp: string;
  action: RegulatedAction;
  severity: ComplianceSeverity;
  userId?: string;
  entityId?: string;
  entityType?: string;
  result: "allowed" | "blocked" | "pending_review";
  reason: string;
  isPlaceholder: boolean;
}

/**
 * Log a compliance audit event.
 *
 * TODO_COMPLIANCE_VERIFY: In production, this must write to a persistent
 * audit table (not just console). Retention and access policies must comply
 * with Quebec Law 25 and OACIQ record-keeping requirements.
 */
export function logComplianceAudit(entry: ComplianceAuditEntry): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[compliance-audit]", JSON.stringify(entry));
  }
}

/**
 * Query compliance audit trail for an entity.
 *
 * TODO_COMPLIANCE_VERIFY: Not yet implemented. Returns empty array.
 */
export async function getAuditTrail(
  _entityType: string,
  _entityId: string
): Promise<ComplianceAuditEntry[]> {
  return [];
}

/**
 * Check inspection mode status.
 *
 * TODO_COMPLIANCE_VERIFY: Inspection mode should be enabled during
 * regulatory audits. Implementation pending.
 */
export function inspectionModeStatus(): { enabled: boolean; reason: string } {
  return {
    enabled: false,
    reason: "TODO_COMPLIANCE_VERIFY: Inspection mode not yet implemented.",
  };
}
