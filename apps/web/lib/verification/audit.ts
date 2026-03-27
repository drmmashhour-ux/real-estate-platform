/**
 * Admin audit logging for verification actions.
 * Logs who verified/rejected a listing and when; use for RBAC and compliance.
 * In production, persist to a dedicated admin_audit_log or control_action_audit_log table.
 */

export type VerificationAuditAction = "verify_listing" | "reject_listing" | "request_more_documents";

export async function logVerificationAction(params: {
  action: VerificationAuditAction;
  listingId: string;
  adminUserId: string;
  verificationStatus?: string;
  notes?: string | null;
}) {
  // Persist to property_verifications.notes or a dedicated audit table.
  // Here we only ensure the decision is stored on property_verification (verified_by, verifiedAt, notes).
  // For a full audit trail, add a table: admin_verification_audit (id, action, listing_id, admin_user_id, status, notes, created_at).
  if (process.env.NODE_ENV !== "production") {
    console.info("[VerificationAudit]", params.action, params.listingId, params.adminUserId, params.verificationStatus);
  }
  return Promise.resolve();
}
