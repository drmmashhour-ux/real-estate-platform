/**
 * Resolves which user id powers “lister” dashboards (BNHUB host, shared tooling).
 * Priority: explicit URL (support/debug) → signed-in session → public demo env.
 */
export function resolveListerOwnerId(params: {
  explicitOwnerId: string | null | undefined;
  sessionUserId: string | null;
  demoOwnerIdEnv: string | null | undefined;
}): string | null {
  const trimmed = typeof params.explicitOwnerId === "string" ? params.explicitOwnerId.trim() : "";
  if (trimmed.length > 0) return trimmed;
  if (params.sessionUserId) return params.sessionUserId;
  const demo = typeof params.demoOwnerIdEnv === "string" ? params.demoOwnerIdEnv.trim() : "";
  if (demo.length > 0) return demo;
  return null;
}
