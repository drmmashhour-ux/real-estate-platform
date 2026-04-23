export function withTenantScope<T extends Record<string, unknown>>(tenantId: string, where?: T) {
  return {
    ...(where ?? ({} as T)),
    tenantId,
  } as T & { tenantId: string };
}
