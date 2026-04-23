export { getTenantContext, getTenantContextOptional } from "@repo/tenant";

import { getTenantContextOptional } from "@repo/tenant";

/**
 * Throws when no tenant resolved — legacy error token for existing call sites.
 */
export async function requireTenantContext() {
  const tenant = await getTenantContextOptional();
  if (!tenant) {
    throw new Error("TENANT_NOT_RESOLVED");
  }
  return tenant;
}
