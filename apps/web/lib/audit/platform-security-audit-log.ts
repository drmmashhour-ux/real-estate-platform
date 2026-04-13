/**
 * Structured security / admin audit hook. Logs JSON to stdout (log drain friendly).
 * Does not write PII in free-text; pass opaque IDs only.
 */
export type PlatformAuditPayload = {
  action: string;
  actorUserId?: string | null;
  targetType?: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export function logPlatformAuditEvent(payload: PlatformAuditPayload): void {
  const line = JSON.stringify({
    event: "platform_audit",
    ts: new Date().toISOString(),
    ...payload,
  });
  console.log(line);
}
