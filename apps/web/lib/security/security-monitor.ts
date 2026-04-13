/**
 * Threshold evaluation + optional auto IP block. Intended for cron (e.g. every 15–60 min).
 */
import { prisma } from "@/lib/db";
import { createSystemAlert } from "@/lib/observability";
import { blockSecurityIp } from "@/lib/security/ip-block";

const DEDUPE_MS = 6 * 60 * 60 * 1000;

async function hasRecentUnresolvedAlert(alertType: string): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_MS);
  const row = await prisma.systemAlert.findFirst({
    where: {
      alertType,
      resolvedAt: null,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export type SecurityMonitorResult = {
  alertsCreated: number;
  autoBlocks: number;
};

/**
 * Compares last 24h vs prior 24h for key signals; creates `SystemAlert` rows when thresholds hit.
 * Optionally auto-blocks IPs with extreme failed-login counts (6h window).
 */
export async function runSecurityMonitor(): Promise<SecurityMonitorResult> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const since = new Date(now - day);
  const prevStart = new Date(now - 2 * day);
  const prevEnd = since;
  const sixHours = new Date(now - 6 * 60 * 60 * 1000);

  let alertsCreated = 0;
  let autoBlocks = 0;

  const [
    failNow,
    failPrev,
    payFail,
    payFailPrev,
    whSig,
    whSigPrev,
    signupSpike,
    signupPrev,
  ] = await Promise.all([
    prisma.platformEvent.count({ where: { eventType: "auth_login_failure", createdAt: { gte: since } } }),
    prisma.platformEvent.count({
      where: { eventType: "auth_login_failure", createdAt: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.platformEvent.count({ where: { eventType: "payment_failed", createdAt: { gte: since } } }),
    prisma.platformEvent.count({
      where: { eventType: "payment_failed", createdAt: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_webhook_signature_invalid", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: {
        eventType: "security_webhook_signature_invalid",
        createdAt: { gte: prevStart, lt: prevEnd },
      },
    }),
    prisma.platformEvent.count({
      where: { eventType: "security_repeated_signup_attempt", createdAt: { gte: since } },
    }),
    prisma.platformEvent.count({
      where: {
        eventType: "security_repeated_signup_attempt",
        createdAt: { gte: prevStart, lt: prevEnd },
      },
    }),
  ]);

  if (failNow >= 40 && failNow > Math.max(20, failPrev * 2.5) && !(await hasRecentUnresolvedAlert("LOGIN_ABUSE"))) {
    await createSystemAlert({
      alertType: "LOGIN_ABUSE",
      severity: "WARNING",
      message: `Failed logins spiked: ${failNow} in 24h (prior 24h: ${failPrev}).`,
      threshold: failPrev,
      currentValue: failNow,
      metadata: { window: "24h" },
    });
    alertsCreated += 1;
  }

  if (payFail >= 15 && payFail > Math.max(5, payFailPrev * 2) && !(await hasRecentUnresolvedAlert("PAYMENT_ANOMALY"))) {
    await createSystemAlert({
      alertType: "PAYMENT_ANOMALY",
      severity: "CRITICAL",
      message: `Payment failure events elevated: ${payFail} in 24h (prior: ${payFailPrev}).`,
      threshold: payFailPrev,
      currentValue: payFail,
    });
    alertsCreated += 1;
  }

  if (whSig >= 8 && whSig > Math.max(2, whSigPrev * 2) && !(await hasRecentUnresolvedAlert("WEBHOOK_AUTH_FAILURES"))) {
    await createSystemAlert({
      alertType: "WEBHOOK_AUTH_FAILURES",
      severity: "WARNING",
      message: `Stripe webhook signature failures: ${whSig} in 24h (prior: ${whSigPrev}). Check STRIPE_WEBHOOK_SECRET.`,
      threshold: whSigPrev,
      currentValue: whSig,
    });
    alertsCreated += 1;
  }

  if (signupSpike >= 30 && signupSpike > Math.max(10, signupPrev * 3) && !(await hasRecentUnresolvedAlert("SIGNUP_SPIKE"))) {
    await createSystemAlert({
      alertType: "SIGNUP_SPIKE",
      severity: "WARNING",
      message: `Signup abuse signals: ${signupSpike} in 24h (prior: ${signupPrev}).`,
      threshold: signupPrev,
      currentValue: signupSpike,
    });
    alertsCreated += 1;
  }

  const heavy = await prisma.platformEvent.groupBy({
    by: ["entityId"],
    where: {
      eventType: "auth_login_failure",
      createdAt: { gte: sixHours },
      entityId: { startsWith: "fp:" },
    },
    _count: { _all: true },
    orderBy: { _count: { entityId: "desc" } },
    take: 15,
  });

  for (const row of heavy) {
    const fp = row.entityId?.replace(/^fp:/, "") ?? "";
    if (!fp || row._count._all < 45) continue;
    const existing = await prisma.securityIpBlock.findUnique({ where: { ipFingerprint: fp } });
    if (existing) continue;
    await blockSecurityIp({
      ipFingerprint: fp,
      reason: `auto: ${row._count._all} failed logins in 6h`,
      hours: 48,
    });
    autoBlocks += 1;
  }

  return { alertsCreated, autoBlocks };
}
