/**
 * Central auth / authorization audit hooks. Use from route handlers; never log passwords or raw tokens.
 * Login success/failure use structured stdout (`logSecurityEvent`) — durable DB audit only for denials / admin paths.
 */
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { logSecurityEvent, requestIdFromHeaders } from "@/lib/observability/security-events";
import { securityLog } from "@/lib/security/security-logger";

export type AuthAuditOutcome = "success" | "failure";

/** Login / session establishment attempts (mask identifiers in subjectHint). */
export function auditLoginAttempt(params: {
  outcome: AuthAuditOutcome;
  requestId?: string | null;
  /** Opaque fingerprint or masked id — never raw email/password */
  subjectHint?: string;
  detail?: string;
  /** When true, also persist audit row (e.g. high-security deployments). Default: failure only. */
  persistToAuditLog?: boolean;
}): void {
  logSecurityEvent({
    event: params.outcome === "success" ? "auth_login_success" : "auth_login_failure",
    requestId: params.requestId,
    detail: params.detail,
    subjectHint: params.subjectHint,
  });
  const persist = params.persistToAuditLog === true || params.outcome === "failure";
  if (persist) {
    void recordAuditEvent({
      action: `auth_login_${params.outcome}`,
      payload: {
        detail: params.detail,
        subjectHint: params.subjectHint,
        ts: new Date().toISOString(),
      },
    });
  }
}

/** Privilege or role denial — persist for admin security review when needed. */
export async function auditPermissionDenied(params: {
  requestId?: string | null;
  userId?: string | null;
  resource: string;
  reason: string;
  persist?: boolean;
}): Promise<void> {
  logSecurityEvent({
    event: "permission_denied",
    requestId: params.requestId,
    detail: `${params.resource}:${params.reason}`,
    subjectHint: params.userId ?? undefined,
  });
  await securityLog({
    event: "permission_denied",
    requestId: params.requestId,
    detail: `${params.resource}:${params.reason}`,
    subjectHint: params.userId ?? undefined,
    persist: params.persist ?? true,
    entityType: "AUTHZ",
    entityId: params.resource,
    payload: { reason: params.reason },
  });
}

/** Helper: pull request id from a Request for audit payloads. */
export function authAuditRequestId(req: Request): string | null {
  return requestIdFromHeaders((name) => req.headers.get(name));
}
