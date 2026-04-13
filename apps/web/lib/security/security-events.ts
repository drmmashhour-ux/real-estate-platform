/**
 * Central security event API: structured logs + optional durable `PlatformEvent` rows.
 * Re-exports low-level `logSecurityEvent` from observability; adds typed helpers for common cases.
 */
import { recordPlatformEvent } from "@/lib/observability";
import {
  logSecurityEvent,
  requestIdFromHeaders,
  type SecurityEventName,
} from "@/lib/observability/security-events";

export { logSecurityEvent, requestIdFromHeaders, type SecurityEventName };

/** Persisted `eventType` when using {@link securityLog} from `security-logger.ts` is `security_<event>`. */
export type SecurityPlatformEventType = `security_${SecurityEventName}` | "auth_login_failure" | "auth_login_success";

/** Rate limit hit (high-signal paths only — avoid persisting every generic 429). */
export function trackRateLimitPersisted(params: {
  detail: string;
  ipFingerprint: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "rate_limit_exceeded",
    detail: params.detail,
    subjectHint: params.ipFingerprint,
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_rate_limit_exceeded",
    sourceModule: "security",
    entityType: "RATE_LIMIT",
    entityId: `fp:${params.ipFingerprint}`,
    payload: { detail: params.detail },
  }).catch(() => {});
}

export function trackRepeatedSignupAttempt(params: {
  ipFingerprint: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "repeated_signup_attempt",
    detail: "auth_register_rate_limited",
    subjectHint: params.ipFingerprint,
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_repeated_signup_attempt",
    sourceModule: "security",
    entityType: "SIGNUP",
    entityId: `fp:${params.ipFingerprint}`,
    payload: {},
  }).catch(() => {});
}

export function trackMessagingAbuse(params: {
  detail: string;
  ipFingerprint: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "repeated_messaging_abuse",
    detail: params.detail,
    subjectHint: params.ipFingerprint,
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_repeated_messaging_abuse",
    sourceModule: "security",
    entityType: "MESSAGING",
    entityId: `fp:${params.ipFingerprint}`,
    payload: { detail: params.detail },
  }).catch(() => {});
}

export function trackBookingAbuse(params: {
  detail: string;
  ipFingerprint: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "repeated_booking_abuse",
    detail: params.detail,
    subjectHint: params.ipFingerprint,
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_repeated_booking_abuse",
    sourceModule: "security",
    entityType: "BOOKING",
    entityId: `fp:${params.ipFingerprint}`,
    payload: { detail: params.detail },
  }).catch(() => {});
}

export function trackPermissionDenied(params: {
  detail: string;
  subjectHint?: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "permission_denied",
    detail: params.detail,
    subjectHint: params.subjectHint,
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_permission_denied",
    sourceModule: "security",
    entityType: "AUTHZ",
    entityId: params.subjectHint ?? "unknown",
    payload: { detail: params.detail },
  }).catch(() => {});
}

/** Non-admin user reached an admin-only surface (best-effort; do not log raw emails). */
export function trackSuspiciousAdminAccess(params: {
  userId: string;
  path?: string;
  requestId?: string | null;
}): void {
  logSecurityEvent({
    event: "suspicious_admin_access",
    detail: params.path ?? "admin_route",
    subjectHint: params.userId.slice(0, 12),
    requestId: params.requestId ?? undefined,
  });
  void recordPlatformEvent({
    eventType: "security_suspicious_admin_access",
    sourceModule: "security",
    entityType: "ADMIN",
    entityId: params.userId,
    payload: { path: params.path },
  }).catch(() => {});
}
