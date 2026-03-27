/**
 * Marketplace Health AI – detect fraud/dispute spikes, quality drops, anomalies; emit alerts.
 * Expose in operations dashboards and AI Control Center.
 */
import { prisma } from "@/lib/db";
import type { AiAlertType } from "@prisma/client";

/** Check for fraud spike in last N hours and create AiAlert if threshold exceeded. */
export async function checkFraudSpike(params: { hours?: number; threshold?: number }) {
  const hours = params.hours ?? 24;
  const threshold = params.threshold ?? 10;
  const since = new Date();
  since.setHours(since.getHours() - hours);
  const count = await prisma.fraudSignal.count({
    where: { createdAt: { gte: since } },
  });
  if (count >= threshold) {
    await prisma.aiAlert.create({
      data: {
        alertType: "FRAUD_SPIKE",
        severity: count >= threshold * 2 ? "HIGH" : "MEDIUM",
        title: "Fraud signal spike",
        message: `${count} fraud signals in the last ${hours}h (threshold: ${threshold}).`,
        payload: { count, hours, threshold },
      },
    });
    return { triggered: true, count };
  }
  return { triggered: false, count };
}

/** Check for dispute spike. */
export async function checkDisputeSpike(params: { hours?: number; threshold?: number }) {
  const hours = params.hours ?? 24;
  const threshold = params.threshold ?? 5;
  const since = new Date();
  since.setHours(since.getHours() - hours);
  const count = await prisma.dispute.count({
    where: { createdAt: { gte: since } },
  });
  if (count >= threshold) {
    await prisma.aiAlert.create({
      data: {
        alertType: "DISPUTE_SPIKE",
        severity: count >= threshold * 2 ? "HIGH" : "MEDIUM",
        title: "Dispute volume spike",
        message: `${count} new disputes in the last ${hours}h.`,
        payload: { count, hours, threshold },
      },
    });
    return { triggered: true, count };
  }
  return { triggered: false, count };
}

/** Get active (unacknowledged) AI alerts. */
export async function getActiveAiAlerts(limit = 50) {
  return prisma.aiAlert.findMany({
    where: { acknowledgedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Acknowledge an alert. */
export async function acknowledgeAiAlert(id: string, acknowledgedBy: string) {
  return prisma.aiAlert.update({
    where: { id },
    data: { acknowledgedAt: new Date(), acknowledgedBy },
  });
}

/** Run all marketplace health checks (call from cron or AI Control Center). */
export async function runMarketplaceHealthChecks() {
  const [fraud, dispute] = await Promise.all([
    checkFraudSpike({}),
    checkDisputeSpike({}),
  ]);
  return { fraud, dispute };
}
