import { GrowthEmailQueueStatus, UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { sendEmail, getNotificationEmail } from "@/lib/email/resend";
import type { CeoMetricsSnapshot } from "@/src/modules/ai/decisionEngine";

export type OpsIssue = {
  severity: "critical" | "warning";
  code: string;
  message: string;
};

/**
 * Stripe-adjacent and funnel health checks for the AI CEO ops layer.
 */
export async function runOpsMonitorChecks(metrics?: CeoMetricsSnapshot): Promise<OpsIssue[]> {
  const now = new Date();
  const d1 = subDays(now, 1);
  const issues: OpsIssue[] = [];

  const ext = prisma as unknown as {
    socialScheduledPost?: { count: (args: object) => Promise<number> };
  };
  const [failedEmails, failedSocial, paymentFailed24h] = await Promise.all([
    prisma.growthEmailQueue.count({
      where: { status: GrowthEmailQueueStatus.FAILED, createdAt: { gte: d1 } },
    }),
    ext.socialScheduledPost
      ? ext.socialScheduledPost.count({
          where: { status: "failed", createdAt: { gte: d1 } },
        })
      : Promise.resolve(0),
    prisma.userEvent.count({
      where: { eventType: UserEventType.PAYMENT_FAILED, createdAt: { gte: d1 } },
    }),
  ]);

  if (failedEmails >= 5) {
    issues.push({
      severity: "critical",
      code: "growth_email_failures",
      message: `${failedEmails} growth emails failed in 24h`,
    });
  } else if (failedEmails >= 2) {
    issues.push({
      severity: "warning",
      code: "growth_email_failures",
      message: `${failedEmails} growth email failures in 24h`,
    });
  }

  if (failedSocial >= 4) {
    issues.push({
      severity: "warning",
      code: "social_publish_failures",
      message: `${failedSocial} scheduled social posts failed in 24h`,
    });
  }

  if (paymentFailed24h >= 8) {
    issues.push({
      severity: "critical",
      code: "payment_failed_spike",
      message: `${paymentFailed24h} payment_failed events in 24h — check Stripe + checkout`,
    });
  } else if (paymentFailed24h >= 4) {
    issues.push({
      severity: "warning",
      code: "payment_failed_elevated",
      message: `${paymentFailed24h} payment_failed events in 24h`,
    });
  }

  if (metrics) {
    if (metrics.leadDeltaPct <= -35) {
      issues.push({
        severity: "critical",
        code: "lead_cliff",
        message: `Lead volume down ${Math.abs(metrics.leadDeltaPct)}% vs prior week`,
      });
    } else if (metrics.leadDeltaPct <= -25) {
      issues.push({
        severity: "warning",
        code: "lead_drop",
        message: `Lead volume down ${Math.abs(metrics.leadDeltaPct)}% vs prior week`,
      });
    }

    if (metrics.paymentsSuccess7d >= 3 && metrics.stripeWebhookLogs7d === 0) {
      issues.push({
        severity: "warning",
        code: "stripe_webhook_log_gap",
        message: "Payments observed without recent growth Stripe webhook logs — verify logging pipeline",
      });
    }
  }

  return issues;
}

/**
 * Email platform operators and persist critical issues for audit.
 */
export async function alertAdminOpsIssues(issues: OpsIssue[]): Promise<{ emailed: boolean }> {
  const critical = issues.filter((i) => i.severity === "critical");
  if (!critical.length) return { emailed: false };

  const to =
    process.env.ADMIN_OPS_EMAIL?.trim() ||
    process.env.BROKER_EMAIL?.replace(/.*<([^>]+)>.*/, "$1")?.trim() ||
    getNotificationEmail();
  if (!to?.includes("@")) return { emailed: false };

  const html = `<h2>LECIPM AI CEO — critical operations</h2><ul>${critical.map((c) => `<li><strong>${c.code}</strong>: ${c.message}</li>`).join("")}</ul>`;
  const emailed = await sendEmail({
    to,
    subject: "[LECIPM] AI CEO critical ops alert",
    html,
  });

  for (const issue of critical) {
    await prisma.aiAutomationEvent.create({
      data: {
        eventKey: "ceo_ops_critical",
        payload: { ...issue, source: "ai_ceo_ops_monitor" },
      },
    });
  }

  return { emailed };
}
