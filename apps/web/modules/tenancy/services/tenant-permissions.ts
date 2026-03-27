import type { PlatformRole, Tenant, TenantMembership, TenantRole } from "@prisma/client";
import { tenantRoleHasCapability, type TenantCapability } from "@/modules/tenancy/constants";

export type TenantSubject = {
  platformRole: PlatformRole;
  membership: TenantMembership | null;
};

function activeMembership(m: TenantMembership | null): TenantMembership | null {
  if (!m || m.status !== "ACTIVE") return null;
  return m;
}

/** Platform admins may impersonate / override tenant checks when auditing. */
export function isPlatformAdmin(role: PlatformRole): boolean {
  return role === "ADMIN";
}

export function canViewTenant(user: TenantSubject, tenant: Tenant): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  return !!m && m.tenantId === tenant.id;
}

export function canManageTenant(user: TenantSubject, tenant: Tenant): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  if (!m || m.tenantId !== tenant.id) return false;
  return m.role === "TENANT_OWNER" || m.role === "TENANT_ADMIN";
}

export function canManageTenantMembers(user: TenantSubject, tenant: Tenant): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  if (!m || m.tenantId !== tenant.id) return false;
  return m.role === "TENANT_OWNER" || m.role === "TENANT_ADMIN";
}

export function canCreateTenantRecords(
  user: TenantSubject,
  tenant: Tenant,
  _resourceType: string
): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  if (!m || m.tenantId !== tenant.id) return false;
  return m.role !== "VIEWER";
}

export function canViewTenantAnalytics(user: TenantSubject, tenant: Tenant): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  if (!m || m.tenantId !== tenant.id) return false;
  return tenantRoleHasCapability(m.role, "tenant.analytics");
}

export function membershipHasCapability(
  user: TenantSubject,
  tenant: Tenant,
  cap: TenantCapability
): boolean {
  if (isPlatformAdmin(user.platformRole)) return true;
  const m = activeMembership(user.membership);
  if (!m || m.tenantId !== tenant.id) return false;
  return tenantRoleHasCapability(m.role, cap);
}

/** Minimum role helper for invitations / promotions. */
export function rankTenantRole(a: TenantRole): number {
  const order: TenantRole[] = [
    "VIEWER",
    "STAFF",
    "ASSISTANT",
    "BROKER",
    "TENANT_ADMIN",
    "TENANT_OWNER",
  ];
  return order.indexOf(a);
}
