/**
 * Structured security-oriented logs (stdout). Wire to Sentry/Datadog from log drain — no PII in messages.
 */
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";

export type SecurityEventName =
  | "auth_login_failure"
  | "auth_login_success"
  | "rate_limit_exceeded"
  | "ip_rate_block_set"
  | "suspicious_request"
  | "permission_denied"
  | "webhook_signature_invalid"
  | "webhook_processing_failed"
  | "payment_attempt_blocked"
  | "signup_blocked_kill_switch"
  | "contact_blocked_kill_switch"
  | "admin_action"
  | "repeated_signup_attempt"
  | "repeated_messaging_abuse"
  | "repeated_booking_abuse"
  | "suspicious_admin_access";

export function logSecurityEvent(params: {
  event: SecurityEventName;
  requestId?: string | null;
  /** Short reason code, no user content */
  detail?: string;
  /** Optional hashed or opaque id (never raw email/password) */
  subjectHint?: string;
}): void {
  const line = JSON.stringify({
    type: "lecipm_security",
    event: params.event,
    ts: new Date().toISOString(),
    requestId: params.requestId ?? undefined,
    detail: params.detail,
    subjectHint: params.subjectHint,
  });
  console.info(line);
}

/** Read request id from Headers-like object if present. */
export function requestIdFromHeaders(getHeader: (name: string) => string | null): string | null {
  return getHeader(REQUEST_ID_HEADER) ?? null;
}
