/**
 * Aggregates for `/admin/security` — best-effort counts from `platform_events`.
 */
import type { PrismaClient } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export type SecurityDashboardSummary = {
  windowLabel: string;
  failedLogins: number;
  failedLoginsPrev: number;
  loginAttempts: number;
  signupAttempts: number;
  signupAbuse: number;
  rateLimitPersisted: number;
  messagingSpam: number;
  webhookSignatureFailures: number;
  webhookProcessingFailures: number;
  paymentFailures: number;
  permissionDenials: number;
  suspiciousAdminAccess: number;
  adminEvents: number;
  loginFailureSpike: boolean;
  notes: string[];
};

export async function getSecurityDashboardSummary(prisma: PrismaClient): Promise<SecurityDashboardSummary> {
  const now = Date.now();
  const since = new Date(now - DAY_MS);
  const sincePrev = new Date(now - 2 * DAY_MS);
  const untilPrev = new Date(now - DAY_MS);

  const [
    failedLogins,
    failedLoginsPrev,
    loginAttempts,
    signupAttempts,
    signupAbuse,
    rateLimitPersisted,
    messagingSpam,
    webhookSignatureFailures,
    webhookProcessingFailures,
    paymentFailures,
    permissionDenials,
    suspiciousAdminAccess,
    adminEvents,
  ] = await Promise.all([
    prisma.platformEvent.count({
      where: { eventType: "auth_login_failure", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "auth_login_failure", createdAt: { gte: sincePrev, lt: untilPrev } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "auth_login_attempt", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "auth_signup_attempt", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_repeated_signup_attempt", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_rate_limit_exceeded", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_repeated_messaging_abuse", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_webhook_signature_invalid", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_webhook_processing_failed", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "payment_failed", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_permission_denied", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_suspicious_admin_access", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: {
        createdAt: { gte: since },
        OR: [{ eventType: "security_admin_action" }, { sourceModule: "admin" }],
      },
    }),
  ]);

  const loginFailureSpike =
    failedLogins >= 25 && failedLogins > Math.max(10, failedLoginsPrev * 3);

  const notes: string[] = [];
  if (loginFailureSpike) {
    notes.push("Failed login count is elevated vs prior 24h — review auth logs and IP patterns.");
  }
  if (paymentFailures >= 10) {
    notes.push("Payment failure events are elevated — check Stripe Dashboard and webhook secrets.");
  }
  if (webhookSignatureFailures >= 5) {
    notes.push("Webhook signature failures detected — verify STRIPE_WEBHOOK_SECRET matches Stripe.");
  }
  if (messagingSpam >= 8) {
    notes.push("Messaging abuse signals (rate-limit persistence) — review contact endpoints.");
  }

  return {
    windowLabel: "Last 24 hours",
    failedLogins,
    failedLoginsPrev,
    loginAttempts,
    signupAttempts,
    signupAbuse,
    rateLimitPersisted,
    messagingSpam,
    webhookSignatureFailures,
    webhookProcessingFailures,
    paymentFailures,
    permissionDenials,
    suspiciousAdminAccess,
    adminEvents,
    loginFailureSpike,
    notes,
  };
}
