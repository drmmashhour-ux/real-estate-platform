/**
 * Central role helpers for LECIPM v1. Route handlers may still use domain-specific `require*` imports;
 * prefer these for new code where a simple role check is enough.
 */
import { PlatformRole } from "@prisma/client";

/** Re-export for both type and value consumers. */
export { PlatformRole };

export function isPlatformAdmin(role: PlatformRole): boolean {
  return role === PlatformRole.ADMIN;
}

export function isBnHubHost(role: PlatformRole): boolean {
  return role === PlatformRole.HOST;
}

/** Residential / CRM broker surface (not mortgage-only). */
export function isResidentialBroker(role: PlatformRole): boolean {
  return role === PlatformRole.BROKER;
}

/** Ops roles with elevated back-office access (not full admin). */
export function isOperatorRole(role: PlatformRole): boolean {
  return (
    role === PlatformRole.CONTENT_OPERATOR ||
    role === PlatformRole.LISTING_OPERATOR ||
    role === PlatformRole.OUTREACH_OPERATOR ||
    role === PlatformRole.SUPPORT_AGENT
  );
}

export function isAdminOrOperator(role: PlatformRole): boolean {
  return isPlatformAdmin(role) || isOperatorRole(role);
}

export function isInvestorRelations(role: PlatformRole): boolean {
  return role === PlatformRole.INVESTOR;
}

/** Central auth entry points — use in protected API routes. */
export { getSession } from "@/lib/auth/get-session";
export { requireUser } from "@/lib/auth/require-user";
export { requireRole, type AppRouteRole } from "@/lib/auth/require-role";
