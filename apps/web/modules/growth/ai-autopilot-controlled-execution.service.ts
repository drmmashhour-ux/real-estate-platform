/**
 * Controlled real execution — whitelist + approval + bounded volume only.
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { buildAutopilotBundleFromSnapshot, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import { buildSafeLeadAutopilotActions } from "./ai-autopilot-safe-lead-actions.builder";
import { getAutopilotActionStatus } from "./ai-autopilot-approval.service";
import {
  isLeadsPipelineAutopilotAction,
  isSafeExecutableAutopilotAction,
  maxActionsPerRun,
} from "./ai-autopilot-execution-policy";
import { executeLeadsAutopilotLayer } from "./ai-autopilot-leads-execution.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { isAutopilotActionAlreadyExecuted, setAutopilotExecutionRecord } from "./ai-autopilot-execution-state.service";
import {
  incrementAutopilotMonitor,
  logAutopilotExecutionRun,
} from "./ai-autopilot-execution-monitoring.service";
import { logInfo } from "@/lib/logger";

export type ControlledExecutionResultItem = {
  actionId: string;
  actionType?: string;
  outcome: "executed" | "skipped" | "failed";
  reason?: string;
};

export type ExecuteApprovedSafeActionsResult = {
  attempted: number;
  executed: number;
  skipped: number;
  failed: number;
  results: ControlledExecutionResultItem[];
  runId: string;
};

async function mergeAllActions(): Promise<AiAutopilotAction[]> {
  const snapshot = buildGrowthUnifiedSnapshot();
  const base = buildAutopilotBundleFromSnapshot(snapshot).actions;
  const safe = await buildSafeLeadAutopilotActions();
  return [...base, ...safe];
}

async function executeOne(
  action: AiAutopilotAction,
  actorUserId: string,
): Promise<{
  timelineEventIds?: string[];
  leadRollback?: { leadId: string; launchSalesContacted: boolean; launchLastContactDate: Date | null };
}> {
  const leadId = action.targetId!;
  if (action.actionType === "lead_timeline_handled") {
    const ev = await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType: "ai_autopilot.safe.handled",
        payload: {
          source: "ai_autopilot_safe",
          handled: true,
          actorUserId,
          at: new Date().toISOString(),
        },
      },
    });
    return { timelineEventIds: [ev.id] };
  }
  if (action.actionType === "lead_timeline_followup") {
    const ev = await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType: "ai_autopilot.safe.followup",
        payload: {
          source: "ai_autopilot_safe",
          followUpNeeded: true,
          actorUserId,
          at: new Date().toISOString(),
        },
      },
    });
    return { timelineEventIds: [ev.id] };
  }
  if (action.actionType === "lead_launch_sales_contacted") {
    const existing = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { launchSalesContacted: true, launchLastContactDate: true },
    });
    if (!existing) throw new Error("lead_not_found");
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        launchSalesContacted: true,
        launchLastContactDate: new Date(),
      },
    });
    return {
      leadRollback: {
        leadId,
        lastContactedAt: null,
        launchSalesContacted: existing.launchSalesContacted,
        launchLastContactDate: existing.launchLastContactDate,
      },
    };
  }
  throw new Error("unsupported_action_type");
}

export async function executeApprovedSafeActions(params: { actorUserId: string }): Promise<ExecuteApprovedSafeActionsResult> {
  const runId = randomUUID();
  const results: ControlledExecutionResultItem[] = [];
  let attempted = 0;
  let executed = 0;
  let skipped = 0;
  let failed = 0;

  logAutopilotExecutionRun({ runId, phase: "started" });

  const all = await mergeAllActions();

  for (const action of all) {
    if (executed >= maxActionsPerRun) {
      break;
    }

    if (getAutopilotActionStatus(action.id) !== "approved") {
      skipped += 1;
      incrementAutopilotMonitor("skippedCount", 1);
      results.push({ actionId: action.id, outcome: "skipped", reason: "not_approved" });
      continue;
    }

    if (isAutopilotActionAlreadyExecuted(action.id)) {
      skipped += 1;
      incrementAutopilotMonitor("skippedCount", 1);
      incrementAutopilotMonitor("duplicateSkippedCount", 1);
      results.push({ actionId: action.id, outcome: "skipped", reason: "already_executed" });
      continue;
    }

    const policy = isSafeExecutableAutopilotAction(action, { requireApproved: true });
    if (!policy.ok) {
      skipped += 1;
      incrementAutopilotMonitor("skippedCount", 1);
      if (policy.reason === "action_type_not_whitelisted" || policy.reason === "missing_action_type") {
        results.push({ actionId: action.id, outcome: "skipped", reason: policy.reason });
      } else {
        incrementAutopilotMonitor("unsafeBlockedCount", 1);
        results.push({ actionId: action.id, outcome: "skipped", reason: policy.reason ?? "policy_block" });
      }
      continue;
    }

    attempted += 1;
    incrementAutopilotMonitor("attemptedCount", 1);

    try {
      if (isLeadsPipelineAutopilotAction(action)) {
        const { updated } = await executeLeadsAutopilotLayer(action, params.actorUserId);
        executed += 1;
        incrementAutopilotMonitor("executedCount", 1);
        setAutopilotExecutionRecord(action.id, {
          executionStatus: "executed",
          executionNotes: `leads_ai_layer:updated=${updated}`,
        });
        logInfo("[ai:autopilot:execution]", {
          runId,
          actionId: action.id,
          actionType: "leads_ai_layer",
          mode: "controlled_real",
          updated,
        });
        results.push({
          actionId: action.id,
          actionType: "leads_ai_layer",
          outcome: "executed",
        });
        continue;
      }

      const leadExists = action.targetId
        ? await prisma.lead.findUnique({ where: { id: action.targetId }, select: { id: true } })
        : null;
      if (action.targetType === "lead" && !leadExists) {
        failed += 1;
        incrementAutopilotMonitor("failedCount", 1);
        setAutopilotExecutionRecord(action.id, {
          executionStatus: "failed",
          executionNotes: "lead_not_found",
        });
        results.push({ actionId: action.id, actionType: action.actionType, outcome: "failed", reason: "lead_not_found" });
        continue;
      }

      const out = await executeOne(action, params.actorUserId);
      executed += 1;
      incrementAutopilotMonitor("executedCount", 1);

      setAutopilotExecutionRecord(action.id, {
        executionStatus: "executed",
        executionNotes: "ok",
        timelineEventIds: out.timelineEventIds,
        leadRollback: out.leadRollback,
      });

      logInfo("[ai:autopilot:execution]", {
        runId,
        actionId: action.id,
        actionType: action.actionType,
        mode: "controlled_real",
      });

      results.push({
        actionId: action.id,
        actionType: action.actionType,
        outcome: "executed",
      });
    } catch (e: unknown) {
      failed += 1;
      incrementAutopilotMonitor("failedCount", 1);
      const msg = e instanceof Error ? e.message : "error";
      setAutopilotExecutionRecord(action.id, {
        executionStatus: "failed",
        executionNotes: msg,
      });
      results.push({
        actionId: action.id,
        actionType: action.actionType,
        outcome: "failed",
        reason: msg,
      });
    }
  }

  logAutopilotExecutionRun({
    runId,
    phase: "completed",
    actionIds: results.map((r) => r.actionId),
    summary: { attempted, executed, skipped, failed },
  });

  return { attempted, executed, skipped, failed, results, runId };
}
