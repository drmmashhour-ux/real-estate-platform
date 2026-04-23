export function assertTenantRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) {
    throw new Error("TENANT_PERMISSION_DENIED");
  }
}
