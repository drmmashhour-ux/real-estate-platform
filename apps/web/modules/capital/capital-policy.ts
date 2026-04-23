import type { PlatformRole } from "@prisma/client";

export function canManageCapital(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN";
}

export function canWaiveCriticalFinancingCondition(role: PlatformRole): boolean {
  return role === "ADMIN";
}

export function userCanElevatedCapitalOps(role: PlatformRole): boolean {
  return role === "ADMIN";
}
