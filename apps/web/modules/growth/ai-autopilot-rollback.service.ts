/**
 * Rollback for reversible autopilot executions (timeline delete + lead field restore).
 */

import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import {
  getAutopilotExecutionRecord,
  setAutopilotExecutionRecord,
} from "./ai-autopilot-execution-state.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { buildAutopilotActions } from "./ai-autopilot.service";
import { buildSafeLeadAutopilotActions } from "./ai-autopilot-safe-lead-actions.builder";

async function findActionById(actionId: string): Promise<AiAutopilotAction | null> {
  const base = buildAutopilotActions();
  const safe = await buildSafeLeadAutopilotActions();
  return [...base, ...safe].find((a) => a.id === actionId) ?? null;
}

export type RollbackResult = { ok: boolean; reason?: string };

export async function rollbackExecutedSafeAction(actionId: string): Promise<RollbackResult> {
  const rec = getAutopilotExecutionRecord(actionId);
  if (!rec || rec.executionStatus !== "executed") {
    return { ok: false, reason: "not_executed_or_missing" };
  }

  const action = await findActionById(actionId);
  if (!action?.reversible) {
    return { ok: false, reason: "not_reversible" };
  }

  try {
    if (rec.timelineEventIds?.length) {
      for (const id of rec.timelineEventIds) {
        await prisma.leadTimelineEvent.deleteMany({ where: { id } });
      }
    }

    if (rec.leadRollback) {
      await prisma.lead.update({
        where: { id: rec.leadRollback.leadId },
        data: {
          launchSalesContacted: rec.leadRollback.launchSalesContacted,
          launchLastContactDate: rec.leadRollback.launchLastContactDate,
        },
      });
    }

    setAutopilotExecutionRecord(actionId, {
      executionStatus: "rolled_back",
      executionNotes: "rollback_ok",
      timelineEventIds: undefined,
      leadRollback: undefined,
    });

    logInfo("[ai:autopilot:execution]", { actionId, mode: "rollback", ok: true });
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "rollback_error";
    logInfo("[ai:autopilot:execution]", { actionId, mode: "rollback", ok: false, msg });
    return { ok: false, reason: msg };
  }
}
