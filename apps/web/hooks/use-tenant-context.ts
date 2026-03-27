"use client";

import { useMemo } from "react";

/**
 * Placeholder for tenant-scoped UI context (replace with real tenancy provider).
 */
export function useTenantContext(): { tenantId: string | null } {
  return useMemo(() => ({ tenantId: null }), []);
}
