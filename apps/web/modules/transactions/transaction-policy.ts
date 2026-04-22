import type { PlatformRole } from "@prisma/client";

export const SD_PARTY_ROLES = ["SELLER", "BUYER", "BROKER"] as const;

export function isBrokerOrAdmin(role: PlatformRole | string): boolean {
  return role === "BROKER" || role === "ADMIN";
}

export function canAccessTransaction(role: PlatformRole | string, brokerId: string, transactionBrokerId: string): boolean {
  return role === "ADMIN" || brokerId === transactionBrokerId;
}
