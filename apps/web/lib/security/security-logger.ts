/**
 * Security observability: structured stdout logs + optional durable `PlatformEvent` rows for admin dashboards.
 * Never log secrets, raw tokens, passwords, or full PII.
 */
import { recordPlatformEvent } from "@/lib/observability";
import { logSecurityEvent, type SecurityEventName } from "@/lib/security/security-events";

export type { SecurityEventName };

export async function securityLog(params: {
  event: SecurityEventName;
  requestId?: string | null;
  detail?: string;
  subjectHint?: string;
  /** When true, also persist a row for /admin/security (best-effort, non-blocking). */
  persist?: boolean;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  logSecurityEvent({
    event: params.event,
    requestId: params.requestId,
    detail: params.detail,
    subjectHint: params.subjectHint,
  });

  if (params.persist) {
    const entityType = params.entityType ?? "SECURITY";
    const entityId = params.entityId ?? params.subjectHint ?? "global";
    void recordPlatformEvent({
      eventType: `security_${params.event}`,
      sourceModule: "security",
      entityType,
      entityId,
      payload: {
        detail: params.detail,
        ...(params.payload ?? {}),
      },
    }).catch(() => {});
  }
}
