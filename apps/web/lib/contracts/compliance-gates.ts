/**
 * Optional admin approval gate for listing publish (compliance review queue).
 */
export function requireComplianceAdminApproval(): boolean {
  return process.env.REQUIRE_COMPLIANCE_ADMIN_APPROVAL === "true";
}
