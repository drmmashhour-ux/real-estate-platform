/**
 * Safety contracts for multi-tenant isolation — throw from guards when violated.
 */

export function assertNoCrossTenantLeak(expectedTenantId: string, actualTenantId: string | null | undefined) {
  if (!actualTenantId || actualTenantId !== expectedTenantId) {
    throw new Error("TENANT_ISOLATION_VIOLATION");
  }
}

export function assertTenantResolvedForWhiteLabel(tenantResolved: boolean) {
  if (!tenantResolved) {
    throw new Error("TENANT_RESOLUTION_REQUIRED");
  }
}

export function assertAiContextTenant(expectedTenantId: string, contextTenantId: string | null | undefined) {
  if (!contextTenantId || contextTenantId !== expectedTenantId) {
    throw new Error("TENANT_AI_CONTEXT_VIOLATION");
  }
}
