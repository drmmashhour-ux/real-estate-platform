import type { PlatformRole } from "@prisma/client";

/** Who may create/manage broker portfolios (Portfolio OS). */
export function canManagePortfolio(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN" || role === "INVESTOR";
}
