/**
 * Access to internal compliance tooling (regulator correspondence, policy references).
 * Narrower than full admin — includes legal/privacy/compliance roles.
 */

import type { PlatformRole } from "@prisma/client";

export const COMPLIANCE_OVERSIGHT_ROLES: PlatformRole[] = [
  "ADMIN",
  "COMPLIANCE_STAFF",
  "LEGAL_ADMIN",
  "PRIVACY_OFFICER",
];

export function isComplianceOversightStaff(role: PlatformRole | null | undefined): boolean {
  return role != null && COMPLIANCE_OVERSIGHT_ROLES.includes(role);
}
