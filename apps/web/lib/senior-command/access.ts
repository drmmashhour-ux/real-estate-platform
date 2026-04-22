import { PlatformRole } from "@prisma/client";

/** Operators (HOST listing owners) cannot access the command center — Part 17. */
const BLOCKED_FROM_COMMAND: PlatformRole[] = [PlatformRole.HOST];

/** Growth / ops roles: view + limited mutations (pricing restricted elsewhere). */
const GROWTH_AND_OPS_ROLES: PlatformRole[] = [
  PlatformRole.CONTENT_OPERATOR,
  PlatformRole.LISTING_OPERATOR,
  PlatformRole.OUTREACH_OPERATOR,
  PlatformRole.SUPPORT_AGENT,
];

export type SeniorCommandAccessTier = "none" | "growth" | "admin";

export function seniorCommandAccessTier(role: PlatformRole): SeniorCommandAccessTier {
  if (role === PlatformRole.ADMIN) return "admin";
  if (BLOCKED_FROM_COMMAND.includes(role)) return "none";
  if (GROWTH_AND_OPS_ROLES.includes(role)) return "growth";
  return "none";
}

export function canAccessSeniorCommandCenter(role: PlatformRole): boolean {
  return seniorCommandAccessTier(role) !== "none";
}

/** Full pricing / promotions / operator visibility controls. */
export function canMutateSeniorCommandPricing(role: PlatformRole): boolean {
  return role === PlatformRole.ADMIN;
}

/** Escalate, reassign, boost visibility — admin + growth (logged). */
export function canMutateSeniorCommandOps(role: PlatformRole): boolean {
  const t = seniorCommandAccessTier(role);
  return t === "admin" || t === "growth";
}
