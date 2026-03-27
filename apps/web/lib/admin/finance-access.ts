/**
 * Financial module access — ADMIN + ACCOUNTANT only.
 * Accountants: no system config, no user deletion (enforce per-route).
 */

import type { PlatformRole } from "@prisma/client";

export const FINANCIAL_ROLES: PlatformRole[] = ["ADMIN", "ACCOUNTANT"];

export function isFinancialStaff(role: PlatformRole | null | undefined): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}

/** Full admin only (not accountant) — platform settings, user deletion, etc. */
export function isAdminOnly(role: PlatformRole | null | undefined): boolean {
  return role === "ADMIN";
}

export function assertFinancialStaff(role: PlatformRole | null | undefined): asserts role is PlatformRole {
  if (!isFinancialStaff(role)) {
    throw new Error("Financial access denied");
  }
}

export function assertAdminOnly(role: PlatformRole | null | undefined): asserts role is PlatformRole {
  if (!isAdminOnly(role)) {
    throw new Error("Admin-only action denied");
  }
}
