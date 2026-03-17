/**
 * Platform roles for RBAC.
 * Aligns with LECIPM docs: guest, host, broker, owner, admin, support.
 */
export enum Role {
  GUEST = "GUEST",
  HOST = "HOST",
  BROKER = "BROKER",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
}

export const DEFAULT_ROLE = Role.GUEST;

export const ROLES_ALL: Role[] = Object.values(Role);

export function isRole(value: string): value is Role {
  return ROLES_ALL.includes(value as Role);
}
