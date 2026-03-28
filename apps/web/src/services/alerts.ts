import { prisma } from "@/lib/db";
import { getNotificationEmail, sendEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/logger";

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

export type GrowthAlert = {
  key: string;
  message: string;
  severity: "warning" | "critical";
};

/**
 * Growth / ops alerts — console + optional admin email.
 */
export async function checkGrowthAlerts(): Promise<GrowthAlert[]> {
  const alerts: GrowthAlert[] = [];
  const since = new Date(Date.now() - TWO_DAYS_MS);

  const recentLeads = await prisma.lead.count({ where: { createdAt: { gte: since } } });
  if (recentLeads === 0) {
    alerts.push({
      key: "no_leads_48h",
      message: "No leads created in the last 48 hours.",
      severity: "warning",
    });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedPayments = await prisma.userEvent.count({
    where: { eventType: "PAYMENT_FAILED", createdAt: { gte: dayAgo } },
  });
  if (failedPayments >= 8) {
    alerts.push({
      key: "payment_fail_spike",
      message: `High volume of payment_failed events in 24h (${failedPayments}).`,
      severity: "critical",
    });
  }

  for (const a of alerts) {
    logInfo(`[growth-alert] ${a.key}`, { message: a.message });
    console.warn(`[GROWTH ALERT] ${a.severity.toUpperCase()}: ${a.message}`);
    const to = getNotificationEmail();
    if (to && process.env.GROWTH_ALERTS_EMAIL !== "0") {
      void sendEmail({
        to,
        subject: `[LECIPM Growth] ${a.key}`,
        html: `<p><strong>${a.severity}</strong></p><p>${a.message}</p>`,
      }).catch((e) => logError("growth alert email failed", e));
    }
  }

  return alerts;
}
