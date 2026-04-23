import { headers } from "next/headers";

import { resolveTenantFromHost } from "./resolve";

/**
 * Strict tenant resolution for white-label routes only.
 * @throws Error("TENANT_NOT_FOUND") when host does not map to a tenant.
 */
export async function getTenantContext() {
  const h = await headers();
  const host = h.get("host") || "";

  const tenant = await resolveTenantFromHost(host);

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  return tenant;
}

/**
 * Same as resolve from host but returns null instead of throwing — use for root layout / platform domain.
 */
export async function getTenantContextOptional() {
  const h = await headers();
  const host = h.get("host") ?? "";
  return resolveTenantFromHost(host);
}
