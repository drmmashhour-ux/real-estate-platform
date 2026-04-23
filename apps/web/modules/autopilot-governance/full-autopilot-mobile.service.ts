import { prisma } from "@/lib/db";

import { evaluateAutopilotAlerts } from "@/modules/autopilot-alerts/autopilot-alerts.service";
import { listApprovalQueue } from "./autopilot-approval-queue.service";
import { listRecentAutopilotAuditRows } from "@/modules/autopilot-review/autopilot-audit-view.service";
import { getGlobalAutopilotPause } from "./autopilot-global-pause.service";
import {
  getAutopilotHeadlineMetrics,
  getAutopilotOperatorWidgets,
} from "@/modules/autopilot-metrics/autopilot-metrics.service";

export async function buildMobileFullAutopilotSummary() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [metrics, approvals, alerts, audit, pause, widgets] = await Promise.all([
    getAutopilotHeadlineMetrics(since),
    listApprovalQueue({ take: 25 }),
    evaluateAutopilotAlerts(),
    listRecentAutopilotAuditRows(30),
    getGlobalAutopilotPause(),
    getAutopilotOperatorWidgets(since, startOfToday),
  ]);

  const wins = audit.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").slice(0, 5);
  const worst = audit.filter((r) => r.decisionOutcome === "BLOCK").slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    pausedAll: pause.paused,
    metrics,
    approvals: approvals.filter((a) => a.status === "PENDING").slice(0, 10),
    alerts: alerts.alerts.slice(0, 12),
    recentExecutions: audit.slice(0, 20),
    winsToday: wins,
    worstBlocked: worst,
    domainsNeedingReview: approvals.filter((a) => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL"),
    operatorWidgets: widgets,
  };
}

export async function listMobileExecutions(take = 40) {
  return prisma.lecipmFullAutopilotExecution.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      domain: true,
      actionType: true,
      decisionOutcome: true,
      riskLevel: true,
      explanation: true,
      createdAt: true,
      platformActionId: true,
    },
  });
}
