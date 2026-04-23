import { prisma } from "@/lib/db";

import { getAutopilotHeadlineMetrics } from "@/modules/autopilot-metrics/autopilot-metrics.service";

export type AutopilotAlertSeverity = "info" | "warning" | "critical";

export type AutopilotAlertItem = {
  severity: AutopilotAlertSeverity;
  title: string;
  detail: string;
  detectedAt: string;
};

/** Rule-based alerting on aggregates (cheap to run from dashboard / cron). */
export async function evaluateAutopilotAlerts(now = new Date()) {
  const since = new Date(now);
  since.setDate(since.getDate() - 7);

  const metrics = await getAutopilotHeadlineMetrics(since);
  const alerts: AutopilotAlertItem[] = [];

  if (metrics.failureRate > 0.45 && metrics.totalExecutions >= 15) {
    alerts.push({
      severity: "critical",
      title: "High autopilot block rate",
      detail: `${(metrics.failureRate * 100).toFixed(0)}% decisions blocked — review modes and governance.`,
      detectedAt: now.toISOString(),
    });
  }

  const pending = await prisma.platformAutopilotAction.count({
    where: {
      entityType: "lecipm_full_autopilot",
      status: "pending_approval",
      createdAt: { gte: since },
    },
  });

  if (pending > 80) {
    alerts.push({
      severity: "warning",
      title: "Approval backlog",
      detail: `${pending} items pending — risk of SLA drift on operator review.`,
      detectedAt: now.toISOString(),
    });
  }

  const rollRate =
    metrics.totalExecutions === 0 ? 0 : metrics.rollbackCount / metrics.totalExecutions;
  if (rollRate > 0.2 && metrics.totalExecutions >= 10) {
    alerts.push({
      severity: "warning",
      title: "Elevated rollback rate",
      detail: "Repeated rollbacks may indicate policy drift or unsafe automation surface.",
      detectedAt: now.toISOString(),
    });
  }

  return { alerts, metricsSnapshot: metrics };
}
