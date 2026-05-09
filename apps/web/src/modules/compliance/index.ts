/**
 * LECIPM Compliance Engine
 *
 * Shared OACIQ/legal guardrail layer. See README.md for details.
 */

export { COMPLIANCE_CODES } from "./constants";
export type {
  ComplianceCheckResult,
  ComplianceGateResult,
  ComplianceSeverity,
  RegulatedAction,
} from "./types";
export {
  canPublishListing,
  requiresBrokerReview,
  missingRequiredForms,
  auditSeverity,
  blockingReasons,
} from "./server/checks";
export { logComplianceAudit, getAuditTrail, inspectionModeStatus } from "./server/audit";

export const MODULE_ID = "compliance" as const;
