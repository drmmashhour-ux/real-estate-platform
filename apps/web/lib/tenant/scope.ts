export type TenantScopedWhere<T extends Record<string, unknown>> = T & { tenantId: string };

export function withTenantScope<T extends Record<string, unknown>>(
  tenantId: string,
  where?: T,
): TenantScopedWhere<T> {
  return {
    ...(where ?? ({} as T)),
    tenantId,
  } as TenantScopedWhere<T>;
}
