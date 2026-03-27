/**
 * Role-based access control – unified across all hubs.
 * VISITOR: read only | USER: booking, messaging | HOST/BROKER/DEVELOPER: manage | ADMIN: full.
 */

import type { PlatformRole } from "@prisma/client";

export type HubRole = "VISITOR" | "USER" | "HOST" | "BROKER" | "DEVELOPER" | "ADMIN";

/** Map DB role to capability set */
export function canBrowse(_role: PlatformRole | null): boolean {
  return true; // Visitor + all
}

export function canSaveListings(role: PlatformRole | null): boolean {
  if (!role) return false;
  return [
    "USER",
    "CLIENT",
    "TESTER",
    "HOST",
    "BROKER",
    "BUYER",
    "SELLER_DIRECT",
    "MORTGAGE_EXPERT",
    "MORTGAGE_BROKER",
    "DEVELOPER",
    "ADMIN",
  ].includes(role);
}

export function canContact(role: PlatformRole | null): boolean {
  if (!role) return false;
  return role !== "VISITOR";
}

export function canBook(role: PlatformRole | null): boolean {
  if (!role) return false;
  return [
    "USER",
    "CLIENT",
    "TESTER",
    "HOST",
    "BROKER",
    "BUYER",
    "SELLER_DIRECT",
    "MORTGAGE_EXPERT",
    "MORTGAGE_BROKER",
    "DEVELOPER",
    "ADMIN",
  ].includes(role);
}

export function canMessage(role: PlatformRole | null): boolean {
  if (!role) return false;
  return role !== "VISITOR";
}

/** Professional: must sign up, verify, accept legal terms */
export function canManageBnhubListings(role: PlatformRole | null, brokerStatus?: string): boolean {
  if (!role) return false;
  return role === "HOST" || role === "ADMIN";
}

export function canManageDeals(role: PlatformRole | null, brokerStatus?: string): boolean {
  if (!role) return false;
  if (role === "ADMIN") return true;
  return role === "BROKER" && brokerStatus === "VERIFIED";
}

export function canAccessCrm(role: PlatformRole | null, brokerStatus?: string): boolean {
  return canManageDeals(role, brokerStatus);
}

export function canManageProjects(role: PlatformRole | null): boolean {
  if (!role) return false;
  return role === "DEVELOPER" || role === "ADMIN";
}

export function isAdmin(role: PlatformRole | null): boolean {
  return role === "ADMIN";
}

/** Financial dashboard & exports (ADMIN or ACCOUNTANT) */
export function canAccessFinancialModule(role: PlatformRole | null): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}

/** Require role for route – throws if not allowed */
export function requireRole(
  role: PlatformRole | null,
  allowed: PlatformRole[]
): asserts role is PlatformRole {
  if (!role || !allowed.includes(role)) {
    throw new Error("Access denied");
  }
}

export function requireBroker(role: PlatformRole | null, brokerStatus: string | null): void {
  if (role !== "BROKER" || brokerStatus !== "VERIFIED") {
    throw new Error("Broker verification required");
  }
}
