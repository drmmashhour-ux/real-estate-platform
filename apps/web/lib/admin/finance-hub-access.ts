/**
 * Finance Admin Hub — operational finance + compliance (Québec tax, obligations, private investment).
 */

import type { PlatformRole } from "@prisma/client";

export const FINANCE_ADMIN_HUB_ROLES: PlatformRole[] = [
  "ADMIN",
  "ACCOUNTANT",
  "COMPLIANCE_STAFF",
  "LEGAL_ADMIN",
];

export function canAccessFinanceAdminHub(role: PlatformRole | null | undefined): boolean {
  return role != null && FINANCE_ADMIN_HUB_ROLES.includes(role);
}
