type TenantAuditAction =
  | "tenant_created"
  | "brand_updated"
  | "member_invited"
  | "role_changed"
  | "feature_toggled"
  | "snapshot_generated"
  | "ai_session_run";

export function logTenantAudit(payload: {
  action: TenantAuditAction;
  tenantId?: string;
  actorUserId?: string;
  meta?: Record<string, unknown>;
}) {
  const line = JSON.stringify({
    kind: "tenant_audit",
    at: new Date().toISOString(),
    ...payload,
  });
  if (process.env.NODE_ENV === "production") {
    console.info(line);
  } else {
    console.info(`[tenant-audit] ${line}`);
  }
}
