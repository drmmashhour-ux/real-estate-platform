import { headers } from "next/headers";

import { resolveTenantFromHost } from "@/lib/tenant/resolve";

/**
 * Optional tenant context — use for root layout / marketing so the main domain never throws.
 */
export async function getTenantContextOptional() {
  const h = await headers();
  const host = h.get("host") ?? "";
  if (!host) return null;
  return resolveTenantFromHost(host);
}

/**
 * Throws when no tenant resolved — use only on routes that must run under a white-label host.
 */
export async function requireTenantContext() {
  const tenant = await getTenantContextOptional();
  if (!tenant) {
    throw new Error("TENANT_NOT_RESOLVED");
  }
  return tenant;
}
