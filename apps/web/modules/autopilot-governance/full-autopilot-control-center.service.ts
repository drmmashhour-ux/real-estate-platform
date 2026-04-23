import { prisma } from "@/lib/db";

import { listDomainMatrix } from "./autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { KillSwitchPosition } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";
import { normalizePersistedMode } from "./autopilot-domain-matrix.service";
import { getGlobalAutopilotPause } from "./autopilot-global-pause.service";
import { listApprovalQueue } from "./autopilot-approval-queue.service";
import { evaluateAutopilotAlerts } from "@/modules/autopilot-alerts/autopilot-alerts.service";
import { listRecentAutopilotAuditRows } from "@/modules/autopilot-review/autopilot-audit-view.service";
import { getAutopilotHeadlineMetrics } from "@/modules/autopilot-metrics/autopilot-metrics.service";
import { analyzeAutopilotFailures } from "@/modules/autopilot-metrics/autopilot-failure-analysis.service";
import {
  getAutopilotOperatorWidgets,
} from "@/modules/autopilot-metrics/autopilot-metrics.service";
import { recommendDomainModes } from "./autopilot-recommended-mode.service";

export async function buildFullAutopilotControlCenterPayload() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    globalPause,
    configs,
    metrics,
    alertPack,
    audit,
    approvals,
    failures,
    recommendations,
    operatorWidgets,
  ] = await Promise.all([
    getGlobalAutopilotPause(),
    prisma.lecipmFullAutopilotDomainConfig.findMany(),
    getAutopilotHeadlineMetrics(since),
    evaluateAutopilotAlerts(),
    listRecentAutopilotAuditRows(50),
    listApprovalQueue({ take: 40 }),
    analyzeAutopilotFailures(since),
    recommendDomainModes(),
    getAutopilotOperatorWidgets(since, startOfToday),
  ]);

  const roiSnapshot = {
    linkedRows: operatorWidgets.outcomeLinkedExecutions7d,
    note: "Advisory counts of executions with populated outcome deltas (`outcomeDeltaJson`). Not a revenue guarantee.",
  };

  const cfgMap = new Map(configs.map((c) => [c.domainId, c]));
  const matrix = listDomainMatrix();

  const modeOverview = matrix.map((m) => {
    const row = cfgMap.get(m.domain);
    const mode = normalizePersistedMode(row?.mode ?? m.defaultMode) as FullAutopilotMode;
    const ks = (row?.killSwitch ?? "ON") as KillSwitchPosition;
    const boundedFull =
      mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT_BOUNDED";
    const gated =
      mode === "FULL_AUTOPILOT_APPROVAL" || m.requiresApproval || m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL";

    return {
      domain: m.domain,
      effectiveMode: mode,
      killSwitch: ks,
      matrixDefaultMode: m.defaultMode,
      riskLevel: m.riskLevel,
      boundedFullAutopilotEligible: boundedFull,
      gatedHighRisk: gated,
      reason: m.reason,
    };
  });

  const feedAuto = audit.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").slice(0, 25);
  const feedQueued = approvals.filter((a) => a.status === "PENDING").slice(0, 25);
  const feedBlocked = audit.filter((r) => r.decisionOutcome === "BLOCK").slice(0, 25);

  const reversible = audit.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").slice(0, 15);

  return {
    advisory:
      "Bounded autopilot: automatic execution applies only to policy-approved low-risk actions; critical domains stay gated.",
    generatedAt: new Date().toISOString(),
    globalPause,
    modeOverview,
    liveFeed: {
      automatic: feedAuto,
      queuedApprovals: feedQueued,
      blocked: feedBlocked,
    },
    approvals,
    killSwitchOverview: configs.map((c) => ({
      domainId: c.domainId as LecipmAutopilotDomainId,
      killSwitch: c.killSwitch,
      mode: c.mode,
      changedBy: c.lastChangedById,
      changedAt: c.updatedAt.toISOString(),
      reason: c.lastReason,
    })),
    outcomeMetrics: metrics,
    measurementNotes: {
      revenueConversionAdvisory:
        "Revenue and conversion uplift require outcome linkage from domain workers into `outcomeDeltaJson`.",
      roiSnapshot,
      operatorWidgets,
    },
    rollbackCandidates: reversible.map((r) => ({
      id: r.id,
      domain: r.domain,
      actionType: r.actionType,
      platformActionId: r.platformActionId,
    })),
    alerts: alertPack.alerts,
    failures,
    recommendations,
  };
}
